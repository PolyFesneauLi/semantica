## Context

See `proposal.md` for why the rail catalog is missing. Today the rail is hard-coded in `explorer/src/App.tsx` (`navItems` plus the `SKE` brand control) while `README.md` and `explorer/README.md` describe a different, feature-named workspace list. Per-workspace I/O already exists on the FastAPI routes under `semantica/explorer/routes/`; this change documents that live surface rather than extending it. Related in-flight work `explorer-canvas-first-chrome` only changes Graph Explore chrome and is out of scope.

## Goals / Non-Goals

**Goals:**

- Make `explorer/README.md` the operator catalog: one section per rail control with usage, tabs, input content/format, and output content/format matching `specs/explorer-app-rail/spec.md`.
- Keep the root `README.md` Knowledge Explorer table as a short index of the same rail labels, pointing at the explorer README for full I/O.
- Add a cheap alignment check so the catalog cannot drift from `navItems` labels or from the UI-exposed import/export and query formats.
- Tighten existing workspace subtitles in `App.tsx` only when they contradict the catalog.

**Non-Goals:**

- New in-app help, tooltips, or onboarding tours.
- Expanding Enrich export UI beyond `json`/`csv` even though `/api/export` also accepts RDF and GraphML.
- Changing any route payload, auth, or graph-session loader.
- Documenting Memories as always-visible; it remains conditional on `agent_memory`.

## Decisions

### 1. Explorer README is the catalog source of truth

The detailed I/O tables live in `explorer/README.md` under Workspaces. Root `README.md` keeps a six-row rail index plus the existing launch instructions (`semantica-explorer --graph`, ContextGraph JSON). Duplicating full I/O in both files would drift.

Alternatives considered: root README only (too long for the project homepage); in-app help panel (out of scope).

### 2. Document UI-exposed formats; footnote API-only extras

Operator catalog rows MUST match what the workspace UI accepts and produces (Enrich export: `json`/`csv`; Vocabulary dropzone: `.ttl`/`.rdf`/`.owl`; Ontology Hub files: `.ttl` `.rdf` `.owl` `.nt` `.jsonld` `.json` `.xml` `.n3`). A short note MAY mention that `POST /api/export` also supports Turtle, N-Triples, N3, RDF/XML, JSON-LD, and GraphML so we do not hide the API. Specs stay on the UI contract.

Alternatives considered: listing every API format in the operator table (over-claims the Enrich dropdown); omitting API extras entirely (operators who already use `/api/export` lose a pointer).

### 3. Session input vs workspace input

Every workspace shares one session-level input: the ContextGraph JSON loaded at process start (`semantica-explorer --graph`). Catalog rows SHALL separate that from per-workspace operator input (uploaded files, SPARQL text, node ids, SHACL Turtle). Welcome/`SKE` is catalogued as navigation + `GET /api/graph/stats` metrics, not as a data-entry surface.

### 4. Alignment test is label-and-format, not HTML scraping

A unit or docs test SHALL:

1. Parse `navItems` labels from `explorer/src/App.tsx` (or a tiny exported constant if a parse is brittle).
2. Assert `explorer/README.md` contains those labels plus `SKE` as catalog headings or table rows.
3. Assert the documented Enrich import extensions remain `{.json,.csv}` and Analyze SPARQL is documented as read-only `SELECT|ASK|CONSTRUCT|DESCRIBE`.

Prefer reading the README and the existing `navItems` array over introducing a runtime JSON schema file. If extracting labels from `App.tsx` is fragile, export `NAV_ITEMS` from a small `navItems.ts` used by `App.tsx` and the test. That is the only allowed code move, and only if the test needs it.

Alternatives considered: OpenAPI-generated docs (accurate for APIs, not for rail grouping); snapshotting the whole README (noisy).

## Risks / Trade-offs

- [Catalog freezes today's incomplete UI] → Specs describe observed behavior, including Enrich Diff and Merge's sample field table. Do not document a live field-diff API that does not exist; say merge is id-based and the side-by-side fields are a preview.
- [README and UI still drift after merge of other Explorer PRs] → Alignment test fails CI when `navItems` labels change without a README update.
- [Overlap with canvas-first chrome docs] → Do not rewrite Graph Explore chrome; the Knowledge Explorer row points at graph browse + Markdown + optional Memories + Vocabulary, not overlay layout.

## Migration Plan

Docs-only for readers. Ship the README updates with the alignment test. Rollback is reverting those files; no data migration.

## Open Questions

None. API-only export formats and Memories visibility are decided above.
