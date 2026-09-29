## 1. Operator catalog in explorer README

- [x] 1.1 Replace the Workspaces table in `explorer/README.md` with a rail catalog that has a heading or row for `SKE`, `Knowledge Explorer`, `Analyze`, `Decisions`, `Enrich`, `Manage`, and `Ontology Hub` in that order, and verify those seven labels appear as first-class entries (not only inner tabs such as Timeline or Registry)
- [x] 1.2 Document session-level input once (ContextGraph JSON via `semantica-explorer --graph`, object with `nodes`/`edges`) separately from per-workspace operator input, and verify the Knowledge Explorer graph row states canvas/inspector/Markdown-with-YAML-frontmatter output
- [x] 1.3 Document Analyze (Reasoning: `predicate(Subject, Object)` facts and `IF ... THEN ...` rules → inferred fact strings; SPARQL: read-only `SELECT|ASK|CONSTRUCT|DESCRIBE` → `{columns, rows, total}` table) and verify those format strings appear under Analyze
- [x] 1.4 Document Decisions (`type: decision` nodes; list fields `decision_id, category, scenario, reasoning, outcome, confidence, timestamp`; chain steps `{id, relationship, content, type}`), Enrich (import `.json`/`.csv` ≤50MB; export UI `json`/`csv`; merge by node ids; optional API-export footnote for RDF/GraphML), Manage (node id → PROV-O lanes; report `json`/`markdown`), and Ontology Hub (file extensions `.ttl .rdf .owl .nt .jsonld .json .xml .n3`; SHACL Turtle), and verify each row names input content, input format, output content, and output format
- [x] 1.5 Note that Memories is shown only when `agent_memory` is provided and that Enrich Diff and Merge field comparison is a sample preview, and verify the catalog does not claim a live field-diff API or an always-visible Memories tab

## 2. Root README index

- [x] 2.1 Replace the Knowledge Explorer workspace table in `README.md` with rail labels Knowledge Explorer, Analyze, Decisions, Enrich, Manage, and Ontology Hub (plus SKE/welcome in prose if needed) and verify inner features are not listed as top-level workspaces
- [x] 2.2 Point that table at `explorer/README.md` for full I/O and verify the root table stays a short index without duplicating the full format catalog

## 3. Alignment test

- [x] 3.1 Add `explorer/tests/appRailCatalog.test.ts` that reads `explorer/README.md` (and the root Knowledge Explorer table) and asserts the rail labels plus Enrich import `.json`/`.csv` and SPARQL `SELECT|ASK|CONSTRUCT|DESCRIBE` are documented; if parsing `navItems` from `App.tsx` is brittle, extract `NAV_ITEMS` to `explorer/src/navItems.ts` and import it in both `App.tsx` and the test, then verify `node --import tsx --test tests/appRailCatalog.test.ts` passes
- [x] 3.2 Register `tests/appRailCatalog.test.ts` in the `test:graph-workspace` script in `explorer/package.json` and verify `npm run test:graph-workspace` still passes

## 4. UI copy alignment

- [x] 4.1 Compare workspace titles/subtitles/kickers in `explorer/src/App.tsx` to the catalog and update only copy that contradicts usage or I/O (do not add help panels), then verify each shell still names the same workspace as its rail button

## 5. Spec coverage check

- [x] 5.1 Walk `openspec/changes/document-explorer-app-rail/specs/explorer-app-rail/spec.md` requirements and confirm each has a corresponding README catalog row or alignment assertion, then verify no spec scenario remains without a docs or test hook
