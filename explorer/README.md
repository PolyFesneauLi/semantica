# Semantica Knowledge Explorer

A browser-based graph workbench for the [Semantica](https://github.com/semantica-agi/semantica) platform. Pan and zoom live graphs, scrub the timeline, trace every decision's causal chain, resolve duplicates, and author your ontology visually. Built on React 19 + Sigma.js.

---

## Requirements

| Dependency | Minimum version |
| --- | --- |
| Python | 3.8+ |
| Node.js | 18.x or higher (20.x recommended) |
| npm | 9.x or higher |

```bash
python --version
node --version
npm --version
```

---

## Two ways to run the Explorer

### Option A — pip install (recommended for users)

Install the package with the explorer extras. The pre-built frontend bundle is included in the wheel so no Node.js is required.

```bash
pip install "semantica[explorer]"
```

Launch the dashboard by pointing it at any graph JSON file:

```bash
semantica-explorer --graph my_graph.json
```

The server starts at `http://127.0.0.1:8000` and opens the dashboard in your default browser automatically.

CLI flags:

| Flag | Default | Description |
| --- | --- | --- |
| `--graph` / `-g` | *(required)* | Path to a ContextGraph JSON file |
| `--port` / `-p` | `8000` | Port to bind the server to |
| `--host` | `127.0.0.1` | Host to bind (use `127.0.0.1` for local-only; see security note below) |
| `--no-browser` | off | Skip opening the browser automatically |

Examples:

```bash
# Default — opens at http://127.0.0.1:8000
semantica-explorer --graph my_graph.json

# Custom port
semantica-explorer --graph my_graph.json --port 8080

# Suppress auto-open
semantica-explorer --graph my_graph.json --no-browser

# Equivalent using python -m
python -m semantica.explorer --graph my_graph.json
```

> **Security note:** Since v0.6.5 the Explorer API requires an API key on protected routes. Set the `SEMANTICA_API_KEY` environment variable and send it as the `X-API-Key` header; without a configured key, protected routes fail closed with `503` rather than serving anonymously. To opt into unauthenticated access for local development only, set `SEMANTICA_ALLOW_ANONYMOUS=true` explicitly. (`/api/health` and `/api/info` are intentionally unauthenticated.)
>
> The default `--host 127.0.0.1` binds to localhost only, so it is not reachable from other machines on your network. If you bind to `0.0.0.0`, all graph data is readable and writable by any host that can reach the port (subject to API-key auth). The CLI prints a warning when binding to a non-loopback host in anonymous mode or when `SEMANTICA_API_KEY` is unset.

---

### Option B — run from source (for contributors / frontend development)

This mode runs the React dev server with hot module replacement, so frontend changes appear in the browser instantly without rebuilding.

#### Step 1 — Clone the repo

```bash
git clone https://github.com/semantica-agi/semantica.git
cd semantica
```

#### Step 2 — Install the Python package

```bash
pip install -e ".[explorer]"
```

#### Step 3 — Install frontend dependencies

```bash
cd explorer
npm ci
```

#### Step 4 — Start the Python backend

Open a terminal in the repo root:

```bash
semantica-explorer --graph path/to/my_graph.json --no-browser
```

This starts the API on `http://127.0.0.1:8000`. Keep this terminal open.

#### Step 5 — Start the frontend dev server

Open a second terminal in `explorer/`:

```bash
npm run dev
```

Vite starts on **`http://localhost:5173`**. Open that URL in your browser. All `/api` and `/ws` requests are automatically proxied to the Python backend at `http://127.0.0.1:8000`.

---

## Building the production bundle

If you need to serve the UI from the Python server directly (without the Vite dev server):

```bash
cd explorer
npm ci
npm run build
```

This writes the compiled assets to `../semantica/static/`. The Python server then serves the full dashboard at `http://127.0.0.1:8000` — no separate Vite process needed.

---

## Workspaces (app rail)

The left rail is the primary navigation: **SKE** (welcome) then six workspaces in order — **Knowledge Explorer**, **Analyze**, **Decisions**, **Enrich**, **Manage**, **Ontology Hub**. Selecting a rail button switches the workspace; it does not reload the graph session.

### Session input (shared)

All workspaces share one session graph loaded at process start:

```bash
semantica-explorer --graph my_graph.json
```

**Format:** ContextGraph JSON — an object with `nodes` and `edges` arrays. Each node has `id`, `type`, and `properties`; each edge has source, target, and type. Per-workspace rows below describe *operator* input on top of that session.

### SKE

| | |
| --- | --- |
| **How to use** | Click the **SKE** brand pill to open the welcome landing (launchers into workspaces; live `GET /api/graph/stats` metrics). |
| **Input** | None (navigation only). |
| **Output** | Welcome screen; node/edge counts when the backend is online. |

### Knowledge Explorer

Tabs: **Semantica Explorer** (graph), optional **Memories** (only when `agent_memory` is provided to `create_app`), **Vocabulary Browser**.

| Tab | How to use | Input (content / format) | Output (content / format) |
| --- | --- | --- | --- |
| **Semantica Explorer** | Pan/zoom the Sigma canvas, search, scrub the timeline, select nodes, optionally edit a node's Markdown | Session graph (see above); canvas interaction; Markdown draft with YAML frontmatter when editing | Live graph scene, node inspector, applied Markdown document with YAML frontmatter |
| **Memories** | Browse/edit canonical AgentMemory documents | Shown only when `agent_memory` is supplied; Markdown apply via `/api/markdown` | Memory list + Markdown documents (not always visible) |
| **Vocabulary Browser** | Browse SKOS schemes/concepts; drop a vocabulary file to import | SKOS RDF file: `.ttl`, `.rdf`, or `.owl` | Scheme/concept hierarchy; import counts (concepts + links) |

### Analyze

Tabs: **Reasoning Playground**, **SPARQL Querying**.

| Tab | How to use | Input (content / format) | Output (content / format) |
| --- | --- | --- | --- |
| **Reasoning Playground** | Paste facts and rules, optionally apply inferences to the graph, Run | Newline-separated facts `predicate(Subject, Object)`; rules `IF ... AND ... THEN ...` | Inferred fact strings; `rules_fired`; when apply-to-graph is on: `added_edges` + `mutated` |
| **SPARQL Querying** | Edit a SPARQL 1.1 query and Run | Read-only queries whose first verb is `SELECT`, `ASK`, `CONSTRUCT`, or `DESCRIBE` (Update verbs `INSERT`/`DELETE`/`DROP`/`LOAD`/`CLEAR`/`CREATE`/`COPY`/`MOVE`/`ADD` are rejected) | Table JSON `{columns, rows, total}` (optional truncation flag); errors include message + optional line |

### Decisions

| | |
| --- | --- |
| **How to use** | Browse `type: decision` nodes; filter by category; open a decision for chain and precedents. |
| **Input** | Optional category filter; selected `decision_id`. |
| **Output** | List fields: `decision_id`, `category`, `scenario`, `reasoning`, `outcome`, `confidence` (number), `timestamp` (ISO-8601 or null). Causal chain steps: `{id, relationship, content, type}`. Precedent matches share the same decision shape. |

### Enrich

Tabs: **Import and Export**, **Diff and Merge**, **Entity Resolution**, **Registry**.

| Tab | How to use | Input (content / format) | Output (content / format) |
| --- | --- | --- | --- |
| **Import and Export** | Drop one file to import, or choose export format and download | Import: `.json` or `.csv` (UTF-8, ≤50 MB). JSON object with `nodes`/`entities` + `edges`/`relationships`, or a node/edge array. CSV headered rows as nodes (`id`/`node_id`/`:ID`) or edges (`source`/`target` or `:START_ID`/`:END_ID`). Export UI: `json` or `csv` | Import: `{nodes_imported, edges_imported}`. Export: `semantica_export.json` (nodes/edges object) or `.csv` table |
| **Diff and Merge** | Enter primary + duplicate node ids and merge | Two node id strings (primary keep, duplicate remove). Side-by-side fields are a **sample preview**, not a live field-diff API | Surviving id + redirected edge count |
| **Entity Resolution** | Scan for duplicates; merge flagged pairs | Threshold scan over session nodes | Pairs `{entity_a, entity_b, score}` (0–1); merge uses the same contract as Diff and Merge |
| **Registry** | Read the chronological mutation audit for this browser session | Client-side registry events (import/export/merge/…) | Chronological audit list |

> **API note:** `POST /api/export` also accepts Turtle, N-Triples, N3, RDF/XML, JSON-LD, and GraphML. The Enrich UI dropdown is limited to `json` and `csv`.

### Manage

Tabs: **PROV-O Lineage**, **KG Overview**, **Ontology Summary**.

| Tab | How to use | Input (content / format) | Output (content / format) |
| --- | --- | --- | --- |
| **PROV-O Lineage** | Look up a node id; download a provenance report | Node id string | Diagram in Agent / Activity / Entity lanes; download `json` (`application/json`) or `markdown` (`text/markdown`) |
| **KG Overview** | Refresh aggregate stats | Session graph | Node/edge counts, type distributions, top connected nodes |
| **Ontology Summary** | Skim ontology summary; jump to Vocabulary Browser | Session / ontology summary payloads | Summary UI; can open Knowledge Explorer → Vocabulary |

### Ontology Hub

Sub-tabs: **Registry**, **Editor**, **Versions**, **Alignments**, **Health**, **SHACL**.

| | |
| --- | --- |
| **How to use** | Load ontologies (URL, file, or create), edit entities, compare versions, manage alignments, review health issues, author SHACL in Turtle. |
| **Input** | Ontology files: `.ttl`, `.rdf`, `.owl`, `.nt`, `.jsonld`, `.json`, `.xml`, `.n3` (or URL / create-from-scratch). SHACL Studio: shapes as Turtle. |
| **Output** | Registry entries; visual editor; version compare; alignment records; health issue list (deep-link into Editor); SHACL Turtle + validation results. |

---

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `EXPLORER_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of allowed CORS origins |
| `EXPLORER_CORS_CREDENTIALS` | `false` | Set to `true` to allow credentialed cross-origin requests (only needed behind an authenticating reverse proxy) |
| `SEMANTICA_API_KEY` | *(unset)* | API key required on protected routes since v0.6.5; send it as the `X-API-Key` header. When unset, protected routes fail closed with `503`. |
| `SEMANTICA_ALLOW_ANONYMOUS` | `false` | Set to `true` to opt into unauthenticated access (local development only). |

---

## Available scripts

Run these from inside the `explorer/` directory:

```bash
# Start the dev server with hot module replacement
npm run dev

# Type-check and build the production bundle into ../semantica/static/
npm run build

# Preview the production build locally
npm run preview

# Run ESLint over all source files
npm run lint

# Run the graph store multi-edge unit tests
npm run test:graph-store

# Run the graph workspace display tests
npm run test:graph-workspace
```

---

## API & WebSocket proxy (dev mode only)

During development, Vite forwards requests automatically — no CORS configuration needed:

| Pattern | Forwarded to |
| --- | --- |
| `/api/*` | `http://127.0.0.1:8000/api/*` |
| `/ws/*` | `ws://127.0.0.1:8000/ws/*` |

To run the backend on a different port, update `server.proxy` in [vite.config.ts](vite.config.ts).

---

## Project structure

```text
explorer/
├── src/
│   ├── App.tsx                        # Root layout, tab routing, workspace wiring
│   ├── index.css                      # Global resets, fonts, keyframe animations
│   ├── store/
│   │   ├── graphStore.ts              # In-memory graph state
│   │   └── registryStore.ts           # Pub/sub audit registry
│   └── workspaces/
│       ├── GraphWorkspace/            # Sigma.js canvas + inspector + behaviors
│       ├── DecisionWorkspace/         # Causal flow diagram + decision list
│       ├── DiffMergeWorkspace/        # Graph diff and merge view
│       ├── EnrichWorkspace/           # Entity resolution + registry tabs
│       ├── ImportExportWorkspace/     # Import CSV/JSON, export graph
│       ├── LineageWorkspace/          # W3C PROV-O lineage diagram
│       ├── ManageWorkspace/           # KG Overview + Ontology Summary
│       ├── OntologyWorkspace/         # SHACL Studio, visual editor, SKOS browser
│       ├── SparqlWorkspace/           # In-browser SPARQL query editor
│       └── VocabularyWorkspace/       # SKOS vocabulary manager
├── index.html
├── vite.config.ts                     # Dev proxy → 127.0.0.1:8000, build → ../semantica/static
└── package.json
```

---

## Troubleshooting

### Dashboard shows a blank white page or "UI not available" message

The frontend bundle is missing from the server's static directory. Fix options:

- **If you installed via pip:** `pip install --upgrade "semantica[explorer]"` — the wheel includes the pre-built bundle.
- **If you installed from source:** run `cd explorer && npm ci && npm run build` from the repo root, then restart the server.
- **In dev mode:** use the Vite dev server at `http://localhost:5173` instead of the backend URL.

### Blank graph / no data loads in the browser

- Confirm the Python backend is running and check the terminal for errors.
- Open browser DevTools → Network tab and look for failed `/api/graph` requests.
- If the backend is on a different port, update `server.proxy` in `vite.config.ts`.

### `npm ci` fails or reports missing lockfile

The `package-lock.json` must be present. Run `npm install` once to generate it, commit it, then use `npm ci` going forward.

### `npm run dev` fails with Node version error

Vite 6 requires **Node 18 or higher**. Run `node --version` to check. If you're on Node 16, upgrade via [nvm](https://github.com/nvm-sh/nvm) or the official Node.js installer.

### Port 5173 already in use

Vite automatically tries the next available port and prints the actual URL in the terminal. Use the URL shown in the output.

### WebSocket not connecting (real-time mutations not appearing)

- Confirm the backend exposes the `/ws/graph-updates` WebSocket endpoint.
- Check DevTools → Network → WS tab for the connection status and error code.
- Ensure the backend version matches the frontend — mixing major versions can cause protocol mismatches.
- **Authentication:** `/ws/graph-updates` enforces the same API key as the REST routes. Browsers cannot set custom headers on a WebSocket handshake, so pass the key as a query parameter instead:
  ```
  ws://127.0.0.1:8000/ws/graph-updates?api_key=<your-key>
  ```
  Non-browser clients (native apps, scripts) may send it as the `X-API-Key` header. A missing or incorrect key results in close code `4401`; if `SEMANTICA_API_KEY` is unset and `SEMANTICA_ALLOW_ANONYMOUS` is not `true`, the connection is also rejected. Note that API keys in URLs appear in server logs — prefer the header for non-browser clients.

---

## Tech stack

- **React 19** + TypeScript (strict mode)
- **Vite 6** with `babel-plugin-react-compiler`
- **Sigma.js 3** + **Graphology** — graph rendering and in-memory graph model
- **ForceAtlas2** — physics-based layout
- **@tanstack/react-query** — async data fetching for ontology and vocab tabs
- **vis-timeline** — temporal event visualization
- **@xyflow/react** — lineage diagram rendering
- **Monaco Editor** — in-browser SPARQL / SHACL editor
- **lucide-react** — icon set

---

## Contributing

See the root [CONTRIBUTING.md](../CONTRIBUTING.md) and open issues on the main [Semantica repository](https://github.com/semantica-agi/semantica).
