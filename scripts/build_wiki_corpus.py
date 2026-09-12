#!/usr/bin/env python3
"""Build a model-readable single-page Wikipedia demo corpus.

Fetches one article URL (or parses offline HTML), splits ``#mw-content-text``
on H2, and writes ``{section}_{name_suffix}.txt`` plus ``Full_*.txt`` and
``SOURCE.md``. Does not follow links or crawl sitemaps.

Example:
  python scripts/build_wiki_corpus.py \\
    --url https://en.wikipedia.org/wiki/Odyssey \\
    --title Odyssey \\
    --name-suffix Odyssey_Title \\
    --output-dir input/odyssey
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import tempfile
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable, List, Optional, Sequence, Tuple
from urllib.parse import quote, urlparse

from bs4 import BeautifulSoup, Tag

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

LICENSE_NAME = "Creative Commons Attribution-ShareAlike (CC BY-SA)"
DEFAULT_UA_TEMPLATE = (
    "SemanticaWikiCorpus/1.0 "
    "(https://github.com/PolyFesneauLi/semantica; "
    "{title} wiki demo corpus builder)"
)

CHROME_HEADINGS = {
    "see also",
    "notes",
    "references",
    "citations",
    "bibliography",
    "further reading",
    "external links",
    "sources",
    "footnotes",
}

CHROME_CLASSES = (
    "infobox",
    "navbox",
    "hatnote",
    "toc",
    "sidebar-toc",
    "reflist",
    "shortdescription",
    "thumb",
    "navbox-styles",
    "mw-references-wrap",
)

CITATION_RE = re.compile(r"\[(?:\d+|[a-z])\]", re.IGNORECASE)
EDIT_RE = re.compile(r"\[edit\]", re.IGNORECASE)
NON_SLUG_RE = re.compile(r"[^A-Za-z0-9]+")
WIKI_H2_SPLIT_RE = re.compile(r"\n== ([^=\n].*?) ==\s*(?:\n|$)")

IngestFn = Callable[..., object]
Section = Tuple[str, str]


class BuildError(Exception):
    """Corpus build failed before a successful swap."""


@dataclass(frozen=True)
class CorpusConfig:
    """Parameters for one single-page Wikipedia corpus build."""

    url: str
    title: str
    name_suffix: str
    output_dir: Path
    user_agent: str = ""

    def __post_init__(self) -> None:
        if not self.url.strip():
            raise ValueError("url is required")
        if not self.title.strip():
            raise ValueError("title is required")
        if not self.name_suffix.strip():
            raise ValueError("name_suffix is required")
        if not re.fullmatch(r"[A-Za-z0-9_]+", self.name_suffix):
            raise ValueError(
                "name_suffix must be ASCII letters, digits, and underscores only"
            )
        if not self.user_agent:
            object.__setattr__(
                self,
                "user_agent",
                DEFAULT_UA_TEMPLATE.format(title=self.title),
            )

    @property
    def extracts_url(self) -> str:
        parsed = urlparse(self.url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        return (
            f"{origin}/w/api.php"
            f"?action=query&format=json&prop=extracts&explaintext=1"
            f"&exsectionformat=wiki&redirects=1&titles={quote(self.title)}"
        )

    @property
    def full_filename(self) -> str:
        return f"Full_{self.name_suffix}.txt"

    @property
    def section_glob(self) -> str:
        return f"*_{self.name_suffix}.txt"


def strip_citations(text: str) -> str:
    """Remove Wikipedia citation markers and [edit] chrome from prose."""
    cleaned = CITATION_RE.sub("", text)
    cleaned = EDIT_RE.sub("", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r" *\n *", "\n", cleaned)
    cleaned = re.sub(r"\s+([,.;:)])", r"\1", cleaned)
    cleaned = re.sub(r"\(\s+", "(", cleaned)
    return cleaned.strip()


def sanitize_heading(heading: str) -> str:
    """Turn a Wikipedia H2 into an ASCII ``{section}`` slug."""
    heading = EDIT_RE.sub("", heading)
    slug = NON_SLUG_RE.sub("_", heading)
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug


def section_filename(heading: str, name_suffix: str) -> str:
    """Return ``{section}_{name_suffix}.txt`` (Lead for the article lead)."""
    slug = sanitize_heading(heading) or "Lead"
    return f"{slug}_{name_suffix}.txt"


def default_name_suffix(title: str) -> str:
    """Derive ``{Title}_Title`` from a Wikipedia page title."""
    slug = sanitize_heading(title) or "Article"
    return f"{slug}_Title"


def normalize_heading_key(heading: str) -> str:
    key = EDIT_RE.sub("", heading).lower()
    key = re.sub(r"[^a-z]+", " ", key)
    return re.sub(r"\s+", " ", key).strip()


def is_chrome_heading(heading: str) -> bool:
    return normalize_heading_key(heading) in CHROME_HEADINGS


def _class_names(el: Tag) -> str:
    classes = el.get("class") or []
    if isinstance(classes, str):
        return classes
    return " ".join(str(c) for c in classes)


def _is_h2_block(el: Tag) -> bool:
    if el.name == "h2":
        return True
    return "mw-heading2" in _class_names(el).split()


def _heading_title(el: Tag) -> str:
    clone = BeautifulSoup(str(el), "html.parser")
    root = clone
    for node in root.select(".mw-editsection"):
        node.decompose()
    headline = root.select_one(".mw-headline") or root.find("h2") or root
    return strip_citations(headline.get_text(" ", strip=True))


def _has_chrome_class(el: Tag) -> bool:
    tokens = set(_class_names(el).split())
    return any(token in tokens for token in CHROME_CLASSES)


def _clean_element_text(el: Tag) -> str:
    clone = BeautifulSoup(str(el), "html.parser")
    for sel in (
        ".mw-editsection",
        "sup.reference",
        "style",
        "script",
        "ol.references",
        ".reflist",
    ):
        for node in clone.select(sel):
            node.decompose()
    return strip_citations(clone.get_text(" ", strip=True))


def _node_prose(el: Tag) -> str:
    if el.name in ("script", "style", "table", "figure", "link", "meta"):
        return ""
    if el.get("id") in {"toc", "mw-toc-heading"}:
        return ""
    if _has_chrome_class(el):
        return ""
    if _is_h2_block(el):
        return ""
    if el.name and el.name.startswith("h") and el.name[1:].isdigit():
        return strip_citations(el.get_text(" ", strip=True))
    if "mw-heading" in _class_names(el).split():
        return _heading_title(el)
    if el.name == "p":
        return _clean_element_text(el)
    if el.name in ("ul", "ol"):
        items = [
            _clean_element_text(li)
            for li in el.find_all("li", recursive=False)
        ]
        return "\n".join(item for item in items if item)
    if el.name == "blockquote":
        return _clean_element_text(el)
    if el.name in ("div", "section"):
        parts = []
        for child in el.children:
            if isinstance(child, Tag):
                part = _node_prose(child)
                if part:
                    parts.append(part)
        return "\n\n".join(parts)
    return ""


def _iter_flow_blocks(root: Tag) -> Iterable[Tag]:
    """Yield article blocks in order, unwrapping MediaWiki ``<section>`` wrappers."""
    for child in root.children:
        if not isinstance(child, Tag):
            continue
        if child.name == "section":
            yield from _iter_flow_blocks(child)
        else:
            yield child


def _select_parser_root(soup: BeautifulSoup) -> Optional[Tag]:
    body = soup.select_one("#mw-content-text")
    if body is None:
        return soup.select_one(".mw-parser-output")
    inner = body.select_one(".mw-parser-output")
    return inner or body


def parse_article_html(html: str) -> List[Section]:
    """Split Wikipedia article HTML into (heading, prose) sections."""
    soup = BeautifulSoup(html, "html.parser")
    root = _select_parser_root(soup)
    if root is None:
        return []

    sections: List[Section] = []
    current_heading = ""
    parts: List[str] = []

    def flush() -> None:
        nonlocal parts
        body = "\n\n".join(p for p in parts if p.strip()).strip()
        parts = []
        if not body:
            return
        if current_heading and is_chrome_heading(current_heading):
            return
        display = current_heading if current_heading else "Lead"
        sections.append((display, body))

    for child in _iter_flow_blocks(root):
        if _is_h2_block(child):
            flush()
            current_heading = _heading_title(child)
            continue
        prose = _node_prose(child)
        if prose:
            parts.append(prose)
    flush()
    return sections


def parse_wiki_extracts(extract: str) -> List[Section]:
    """Parse MediaWiki explaintext (``== Heading ==``) into sections."""
    if not extract or not extract.strip():
        return []
    bits = WIKI_H2_SPLIT_RE.split("\n" + extract.strip())
    sections: List[Section] = []
    lead = strip_citations(bits[0]).strip()
    if lead:
        sections.append(("Lead", lead))
    for i in range(1, len(bits), 2):
        heading = strip_citations(bits[i].strip())
        body = strip_citations(bits[i + 1].strip()) if i + 1 < len(bits) else ""
        if not body or is_chrome_heading(heading):
            continue
        sections.append((heading, body))
    return sections


def _ingest_html(result: object) -> str:
    html = getattr(result, "html", None)
    if isinstance(html, str) and html.strip():
        return html
    text = getattr(result, "text", None)
    if isinstance(text, str):
        return text
    if isinstance(result, str):
        return result
    return ""


def _default_ingest() -> IngestFn:
    from semantica.ingest import ingest_web

    def _call(url: str, **kwargs: object) -> object:
        return ingest_web(url, **kwargs)

    return _call


def _ingest_kwargs(config: CorpusConfig) -> dict:
    # WebIngestor's RobotFileParser.read() uses the default urllib User-Agent.
    # Wikipedia 403s that request, so can_fetch falsely denies /wiki/Title.
    return {
        "method": "url",
        "user_agent": config.user_agent,
        "delay": 1.0,
        "respect_robots": False,
    }


@contextmanager
def _direct_public_requests():
    """Skip WinINet/env proxies so ingest_web's SSRF guard will send the GET."""
    keys = ("NO_PROXY", "no_proxy")
    saved = {key: os.environ.get(key) for key in keys}
    os.environ["NO_PROXY"] = "*"
    os.environ["no_proxy"] = "*"
    try:
        yield
    finally:
        for key, value in saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def _system_proxy_in_use(url: str) -> bool:
    try:
        import requests

        proxies = requests.utils.getproxies()
        return bool(requests.utils.select_proxy(url, proxies))
    except Exception:
        return False


def _fetch_via_requests(url: str, user_agent: str) -> str:
    import requests

    response = requests.get(
        url,
        headers={"User-Agent": user_agent, "Accept": "text/html"},
        timeout=60,
    )
    response.raise_for_status()
    return response.text


def fetch_article_html(
    config: CorpusConfig, ingest: Optional[IngestFn] = None
) -> str:
    """Fetch the article HTML via ingest_web(method='url') or proxy-aware GET."""
    if ingest is not None:
        result = ingest(config.url, **_ingest_kwargs(config))
        return _ingest_html(result)
    if _system_proxy_in_use(config.url):
        return _fetch_via_requests(config.url, config.user_agent)
    ingest_fn = _default_ingest()
    with _direct_public_requests():
        result = ingest_fn(config.url, **_ingest_kwargs(config))
    return _ingest_html(result)


def fetch_extracts_fallback(
    config: CorpusConfig, ingest: Optional[IngestFn] = None
) -> List[Section]:
    extracts_url = config.extracts_url
    if ingest is not None:
        result = ingest(extracts_url, **_ingest_kwargs(config))
        payload = _ingest_html(result)
    elif _system_proxy_in_use(extracts_url):
        payload = _fetch_via_requests(extracts_url, config.user_agent)
    else:
        ingest_fn = _default_ingest()
        with _direct_public_requests():
            result = ingest_fn(extracts_url, **_ingest_kwargs(config))
        payload = _ingest_html(result)
    try:
        data = json.loads(payload)
        pages = data.get("query", {}).get("pages", {})
        first = next(iter(pages.values()), {})
        extract = first.get("extract") or ""
    except (json.JSONDecodeError, AttributeError, TypeError, StopIteration):
        return []
    return parse_wiki_extracts(extract)


def render_full_text(sections: Sequence[Section]) -> str:
    blocks: List[str] = []
    for heading, body in sections:
        if heading == "Lead":
            blocks.append(body)
        else:
            blocks.append(f"{heading}\n\n{body}")
    return "\n\n".join(blocks).strip() + "\n"


def render_source_md(config: CorpusConfig, retrieved_at: datetime) -> str:
    stamp = retrieved_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return (
        f"# Source\n\n"
        f"- Title: {config.title}\n"
        f"- Canonical URL: {config.url}\n"
        f"- Retrieved (UTC): {stamp}\n"
        f"- License: {LICENSE_NAME}\n"
        f"- Attribution: Text adapted from the English Wikipedia article "
        f'"{config.title}".\n'
    )


def write_corpus_atomic(
    config: CorpusConfig,
    sections: Sequence[Section],
    retrieved_at: Optional[datetime] = None,
) -> List[Path]:
    """Write section files into a temp dir, then swap into output_dir."""
    if not sections:
        raise BuildError("empty article body")
    retrieved = retrieved_at or datetime.now(timezone.utc)
    tmp = Path(tempfile.mkdtemp(prefix="wiki-corpus-"))
    written_names: List[str] = []
    try:
        for heading, body in sections:
            name = section_filename(heading, config.name_suffix)
            (tmp / name).write_text(body.rstrip() + "\n", encoding="utf-8")
            written_names.append(name)
        full_name = config.full_filename
        (tmp / full_name).write_text(render_full_text(sections), encoding="utf-8")
        written_names.append(full_name)
        (tmp / "SOURCE.md").write_text(
            render_source_md(config, retrieved), encoding="utf-8"
        )
        written_names.append("SOURCE.md")

        output_dir = config.output_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        for old in output_dir.glob(config.section_glob):
            old.unlink()
        source_md = output_dir / "SOURCE.md"
        if source_md.exists():
            source_md.unlink()
        for name in written_names:
            shutil.move(str(tmp / name), str(output_dir / name))
        return [output_dir / name for name in written_names]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def build_corpus(
    config: CorpusConfig,
    *,
    ingest: Optional[IngestFn] = None,
    html: Optional[str] = None,
) -> List[Path]:
    """Fetch (unless html is provided), parse, and atomically write the corpus."""
    if html is None:
        try:
            html = fetch_article_html(config, ingest=ingest)
        except BuildError:
            raise
        except Exception as exc:
            raise BuildError(f"failed to fetch {config.url}: {exc}") from exc
    sections = parse_article_html(html)
    if not sections:
        try:
            sections = fetch_extracts_fallback(config, ingest=ingest)
        except Exception as exc:
            raise BuildError(
                f"empty article body and extracts fallback failed: {exc}"
            ) from exc
    if not sections:
        raise BuildError("empty article body")
    return write_corpus_atomic(config, sections)


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--url",
        required=True,
        help="Single Wikipedia article URL (no link following)",
    )
    parser.add_argument(
        "--title",
        required=True,
        help="Wikipedia page title (for SOURCE.md and extracts fallback)",
    )
    parser.add_argument(
        "--name-suffix",
        default=None,
        help="Filename suffix after section slug, e.g. Odyssey_Title "
        "(default: {sanitized-title}_Title)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Corpus output directory",
    )
    parser.add_argument(
        "--html-file",
        type=Path,
        default=None,
        help="Parse this HTML file instead of fetching (offline / tests)",
    )
    parser.add_argument(
        "--user-agent",
        default=None,
        help="Override Wikimedia-policy User-Agent",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)
    suffix = args.name_suffix or default_name_suffix(args.title)
    config = CorpusConfig(
        url=args.url,
        title=args.title,
        name_suffix=suffix,
        output_dir=args.output_dir,
        user_agent=args.user_agent or "",
    )
    try:
        html = None
        if args.html_file is not None:
            html = args.html_file.read_text(encoding="utf-8")
        written = build_corpus(config, html=html)
    except (BuildError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    for path in written:
        print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
