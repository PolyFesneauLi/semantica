## Context

See `proposal.md` for why. Constraints that shape the build:

- `semantica extract` reads **one** UTF-8 file (`cli.py` `Path.read_text`); it does not glob a directory.
- `ingest_web(..., method="url")` already fetches a single URL via `WebIngestor.ingest_url` (robots.txt + rate limit + SSRF guard). `method="crawl"` / sitemap MUST NOT be used.
- Stock `ContentExtractor.extract_text` / `HTMLParser._extract_clean_text` flatten the **entire** HTML (skin, nav, footer) into one whitespace-collapsed line. That output is not model-usable Wikipedia prose.
- `input/` is the existing sample-text home (`alice_semantica.txt`, `acme_contract.txt`). Wikimedia content is CC BY-SA and requires a descriptive User-Agent.

## Goals / Non-Goals

**Goals:**

- One-shot builder: fetch Odyssey once, Wikipedia-body-only parse, emit `{section}_Odyssey_Title.txt` plus `Full_Odyssey_Title.txt` and a source record.
- Offline-committed snapshot so extract demos do not hit the network.
- Fixture tests for naming, chrome drop, citation strip, and “no extra article URLs”.

**Non-Goals:**

- No new CLI command, no `WebIngestor` API change, no directory-mode extract.
- No general Wikipedia crawler, no H3-level files, no infobox-as-table dump.
- No live Wikipedia calls in CI.

## Decisions

### 1. Fetch the article URL, parse `#mw-content-text` (not generic extract_text)

**Choice:** Call `ingest_web("https://en.wikipedia.org/wiki/Odyssey", method="url")` and parse `WebContent.html` with BeautifulSoup, scoped to `#mw-content-text` (fallback `.mw-parser-output`). Do not use `content.text` from the default extractor.

**Why:** Matches the URL the operator named; reuses existing single-URL ingest; keeps one article GET (plus the same-origin `robots.txt` check `WebIngestor` already performs — not a second title).

**Alternatives:** MediaWiki `prop=extracts&explaintext` is cleaner plaintext, but it is a different path than the page URL. Keep it as **fallback only** if HTML body parse yields empty prose (same title `Odyssey` on `en.wikipedia.org`, still one resource). Do not follow article links.

**User-Agent:** Override the default `SemanticaBot/1.0` with a Wikimedia-policy string that names the demo builder and the fork repo URL. Wikipedia often 403s anonymous/generic UAs.

### 2. Clean then split on H2; write atomically

Pipeline on `#mw-content-text`:

1. Drop infobox / navbox / hatnote / `mw-editsection` / reference lists / tables used as layout.
2. Walk children in order: lead = nodes before first `h2`; each `h2` opens a section through the next `h2`.
3. Collect `p` (and list items) as separate paragraphs (keep newlines). Strip citation tokens with a regex such as `\[\d+\]` and `\[[a-z]\]`.
4. Drop chrome headings listed in the spec (`See also`, `References`, …), case-insensitive.
5. Sanitize the H2 into `{section}` and write `{section}_Odyssey_Title.txt`.
6. Concatenate kept sections in order into `Full_Odyssey_Title.txt`, each preceded by the original heading line.
7. Write `SOURCE.md` (URL, UTC date, title `Odyssey`, CC BY-SA).

**Atomicity:** Build into a temp directory, then replace generated outputs under `input/odyssey/`. On failure, do not swap; do not leave a new `Full_Odyssey_Title.txt` that looks complete.

**Script path:** `scripts/build_odyssey_wiki_corpus.py` (repo currently has no root `scripts/` for product demos; this is additive). Not a library module under `semantica/`.

### 3. Tests against a fixture, not live Wikipedia

A small HTML fixture (lead + `Synopsis` + `See also` + `[1]` markers + outbound wiki links) is enough to lock naming, citation strip, chrome omission, and that the builder never calls ingest on linked hrefs (mock `ingest_web` / `ingest_url`).

## Risks / Trade-offs

- **[Risk] Wikimedia 403 / UA policy** → Set a descriptive User-Agent; fail non-zero; do not commit an empty corpus.
- **[Risk] Skin/HTML drift** → Selector `#mw-content-text`; extracts API fallback for the same title; fixture tests do not depend on live markup.
- **[Risk] `Full_Odyssey_Title.txt` is large for LLM extract** → Document that operators may pass a single `{section}_Odyssey_Title.txt` instead; do not change extract CLI in this change.
- **[Risk] CC BY-SA share-alike** → `SOURCE.md` committed next to the texts; do not pretend the corpus is original.
- **[Risk] Generic flatten-to-one-line extract** → Never persist `WebContent.text` from the default extractor as corpus output.

## Migration Plan

Additive only: new `scripts/` builder, `input/odyssey/` snapshot, README / commands-reference lines. Rollback is delete those paths; no API or `.env` migration.
