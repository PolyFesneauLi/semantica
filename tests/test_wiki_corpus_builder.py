"""Offline tests for the reusable single-page Wikipedia corpus builder."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "build_wiki_corpus.py"
FIXTURE_PATH = REPO_ROOT / "tests" / "fixtures" / "wiki_article_snippet.html"

DEMO_URL = "https://en.wikipedia.org/wiki/Sample_Topic"
DEMO_TITLE = "Sample Topic"
DEMO_SUFFIX = "Sample_Title"


@pytest.fixture(scope="module")
def wiki():
    spec = importlib.util.spec_from_file_location("build_wiki_corpus", SCRIPT_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def demo_config(wiki, tmp_path: Path):
    return wiki.CorpusConfig(
        url=DEMO_URL,
        title=DEMO_TITLE,
        name_suffix=DEMO_SUFFIX,
        output_dir=tmp_path,
    )


@pytest.fixture
def fixture_html() -> str:
    return FIXTURE_PATH.read_text(encoding="utf-8")


def test_section_filename_and_defaults(wiki) -> None:
    assert (
        wiki.section_filename("Synopsis", "Sample_Title")
        == "Synopsis_Sample_Title.txt"
    )
    assert wiki.default_name_suffix("Sample Topic") == "Sample_Topic_Title"
    assert wiki.strip_citations("Hello [1] world") == "Hello world"


def test_fixture_contains_required_elements(fixture_html: str) -> None:
    assert "Synopsis" in fixture_html
    assert "See also" in fixture_html
    assert "infobox" in fixture_html
    assert "[1]" in fixture_html
    assert "/wiki/Related_Page" in fixture_html
    assert FIXTURE_PATH.is_file()


def test_builder_from_mocked_ingest(
    wiki, demo_config, fixture_html: str, tmp_path: Path
) -> None:
    calls: list[tuple[str, str]] = []

    def fake_ingest(url: str, **kwargs):
        calls.append((url, str(kwargs.get("method"))))
        assert kwargs.get("method") == "url"
        assert "crawl" not in kwargs
        return SimpleNamespace(
            html=fixture_html, text="MUST-NOT-USE-FLAT-TEXT Demo Author infobox"
        )

    written = wiki.build_corpus(demo_config, ingest=fake_ingest)
    names = {path.name for path in written}

    assert calls == [(DEMO_URL, "url")]
    assert f"Lead_{DEMO_SUFFIX}.txt" in names
    assert f"Synopsis_{DEMO_SUFFIX}.txt" in names
    assert f"See_also_{DEMO_SUFFIX}.txt" not in names
    assert not list(tmp_path.glob(f"See_also_{DEMO_SUFFIX}.txt"))

    lead = (tmp_path / f"Lead_{DEMO_SUFFIX}.txt").read_text(encoding="utf-8")
    synopsis = (tmp_path / f"Synopsis_{DEMO_SUFFIX}.txt").read_text(encoding="utf-8")
    full = (tmp_path / f"Full_{DEMO_SUFFIX}.txt").read_text(encoding="utf-8")
    source = (tmp_path / "SOURCE.md").read_text(encoding="utf-8")

    assert "[1]" not in lead
    assert "[1]" not in synopsis
    assert "<" not in lead and "<" not in synopsis
    assert "infobox" not in lead.lower()
    assert "Demo Author" not in lead
    assert "MUST-NOT-USE-FLAT-TEXT" not in lead
    assert "Related Page" in lead
    assert "Ithaca" in synopsis
    assert "Site chrome" not in lead
    assert lead.strip() in full
    assert "Synopsis" in full
    assert full.index("Sample Topic") < full.index("Synopsis")
    assert DEMO_URL in source
    assert "CC BY-SA" in source
    assert DEMO_TITLE in source


def test_different_suffix_is_reusable(wiki, fixture_html: str, tmp_path: Path) -> None:
    """Same HTML + different name_suffix yields differently named files."""
    config = wiki.CorpusConfig(
        url="https://en.wikipedia.org/wiki/Iliad",
        title="Iliad",
        name_suffix="Iliad_Title",
        output_dir=tmp_path,
    )
    written = wiki.build_corpus(config, html=fixture_html)
    names = {path.name for path in written}
    assert "Lead_Iliad_Title.txt" in names
    assert "Synopsis_Iliad_Title.txt" in names
    assert "Full_Iliad_Title.txt" in names
    assert "Lead_Sample_Title.txt" not in names


def test_fetch_failure_does_not_write_full(wiki, demo_config, tmp_path: Path) -> None:
    def boom(url: str, **kwargs):
        raise RuntimeError("blocked")

    with pytest.raises(wiki.BuildError):
        wiki.build_corpus(demo_config, ingest=boom)

    assert not (tmp_path / f"Full_{DEMO_SUFFIX}.txt").exists()
    assert list(tmp_path.iterdir()) == []


def test_empty_body_does_not_write_full(wiki, demo_config, tmp_path: Path) -> None:
    def empty(url: str, **kwargs):
        return SimpleNamespace(
            html="<html><body><p>no wiki body</p></body></html>", text=""
        )

    with pytest.raises(wiki.BuildError):
        wiki.build_corpus(demo_config, ingest=empty)

    assert not (tmp_path / f"Full_{DEMO_SUFFIX}.txt").exists()
