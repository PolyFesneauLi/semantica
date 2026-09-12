## 1. Builder helpers and fixtures

- [x] 1.1 Add `scripts/build_odyssey_wiki_corpus.py` with heading sanitizer (`{section}_Odyssey_Title.txt`), citation-marker strip, chrome-H2 skip list, and `#mw-content-text` H2 splitter; verify a local Python snippet on sample strings produces `Synopsis_Odyssey_Title.txt` and strips `[1]`
- [x] 1.2 Add `tests/fixtures/odyssey_wiki_snippet.html` containing lead, `Synopsis`, `See also`, an infobox table, `[1]` markers, and an outbound `/wiki/Homer` link; verify the fixture file exists and includes those elements

## 2. Fetch, write, and fail-closed behavior

- [x] 2.1 Wire the builder to `ingest_web(..., method="url")` for only `https://en.wikipedia.org/wiki/Odyssey`, with a Wikimedia-policy User-Agent, parse `WebContent.html` (not `.text`), and never call crawl/sitemap; verify a mocked ingest records that single URL
- [x] 2.2 Write outputs atomically to `input/odyssey/` (`Lead_Odyssey_Title.txt`, kept `{section}_Odyssey_Title.txt`, `Full_Odyssey_Title.txt`, `SOURCE.md`) and exit non-zero on fetch/empty-body without swapping a complete-looking corpus; verify a mocked failure leaves no new `Full_Odyssey_Title.txt`

## 3. Tests

- [x] 3.1 Add mocked tests that run the builder on the HTML fixture and assert: `Lead_Odyssey_Title.txt` and `Synopsis_Odyssey_Title.txt` exist, no `See_also_Odyssey_Title.txt`, no `[1]` in prose, no HTML tags, `Full_Odyssey_Title.txt` concatenates in order, `SOURCE.md` has URL + CC BY-SA, and ingest is not called for `/wiki/Homer`; verify `pytest tests/test_odyssey_wiki_demo_corpus.py` passes with no network

## 4. Snapshot and docs

- [x] 4.1 Run the builder once against the live Odyssey page and commit `input/odyssey/` (section files, `Full_Odyssey_Title.txt`, `SOURCE.md`); verify `Lead_Odyssey_Title.txt` and `Full_Odyssey_Title.txt` are non-empty UTF-8 and `SOURCE.md` records the canonical URL and retrieval date
- [x] 4.2 Update `input/README.md` and add a `Commands_reference.md` extract example pointing at `input/odyssey/Full_Odyssey_Title.txt` (and that a single `{section}_Odyssey_Title.txt` may be used for a smaller LLM run); verify those paths appear in the docs
