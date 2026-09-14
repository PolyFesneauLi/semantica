## Purpose

Defines the Explorer left-rail catalog: each control's workspace, how operators use it, and the input/output content and formats they can rely on, plus the requirement that published docs match that catalog.

## ADDED Requirements

### Requirement: App rail presents the workspace catalog
The Explorer SHALL present a left rail with a brand control labeled `SKE` followed by six workspace buttons in this order and with these labels: `Knowledge Explorer`, `Analyze`, `Decisions`, `Enrich`, `Manage`, `Ontology Hub`. Selecting `SKE` SHALL open the welcome landing. Selecting a workspace button SHALL open that workspace without changing the loaded graph session.

#### Scenario: Operator opens Analyze from the rail
- **WHEN** the operator clicks the rail button labeled `Analyze`
- **THEN** the Analyze workspace is shown and the Analyze button is marked active

#### Scenario: Operator returns to welcome via SKE
- **WHEN** the operator clicks the `SKE` brand control
- **THEN** the welcome landing is shown and no workspace button is marked active

### Requirement: Knowledge Explorer graph tab browses the session graph
The Knowledge Explorer workspace SHALL include a graph tab that visualizes the loaded session graph. Session input is the ContextGraph JSON supplied at launch (object with `nodes` and `edges` arrays; each node has `id`, `type`, and `properties`; each edge has source, target, and type). Operator input on this tab is canvas interaction (pan, zoom, search, temporal scrub, node selection) and optional Markdown edits of a selected node's canonical document. Output SHALL be the live graph scene, a node inspector, and (when applied) updated node Markdown returned as a Markdown document with YAML frontmatter.

#### Scenario: Graph tab renders the launched ContextGraph
- **WHEN** the operator opens Knowledge Explorer on the graph tab with a session loaded from ContextGraph JSON
- **THEN** the canvas shows that session's nodes and edges and selecting a node shows its properties in the inspector

### Requirement: Knowledge Explorer vocabulary tab imports SKOS
The Knowledge Explorer workspace SHALL include a Vocabulary Browser tab. Operator input SHALL be a SKOS RDF file with extension `.ttl`, `.rdf`, or `.owl`. Output SHALL be scheme and concept lists plus a hierarchy, and a successful import SHALL report concept and link counts.

#### Scenario: Operator imports a Turtle SKOS file
- **WHEN** the operator drops a `.ttl` SKOS file on the Vocabulary Browser import surface
- **THEN** the system adds concepts and links from that file and shows the resulting scheme/concept hierarchy

### Requirement: Analyze reasoning tab infers facts from rules
The Analyze workspace SHALL include a Reasoning Playground tab. Operator input SHALL be newline-separated facts of the form `predicate(Subject, Object)` and newline-separated rules of the form `IF ... AND ... THEN ...`. Output SHALL be inferred facts as strings, a fired-rule count, and (when apply-to-graph is enabled) newly added graph edges with a mutation flag.

#### Scenario: Operator runs a forward rule
- **WHEN** the operator submits facts `inhibits(Metformin, mTOR)` and `causes(mTOR, Neurodegeneration)` with rule `IF inhibits(Metformin, mTOR) AND causes(mTOR, Neurodegeneration) THEN candidate(Metformin, Alzheimer's)` and apply-to-graph enabled
- **THEN** the result lists inferred fact `candidate(Metformin, Alzheimer's)` and reports whether edges were added to the session graph

### Requirement: Analyze SPARQL tab runs read-only queries
The Analyze workspace SHALL include a SPARQL Querying tab. Operator input SHALL be a SPARQL 1.1 query whose first verb is `SELECT`, `ASK`, `CONSTRUCT`, or `DESCRIBE`. The system MUST reject SPARQL Update verbs (`INSERT`, `DELETE`, `DROP`, `LOAD`, `CLEAR`, `CREATE`, `COPY`, `MOVE`, `ADD`). Output SHALL be a table with `columns` and `rows` (each row a JSON object of variable bindings as strings), plus `total` and a truncation flag; query errors SHALL include a message and optional line number.

#### Scenario: Operator runs a SELECT query
- **WHEN** the operator runs `SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 20` against the session graph
- **THEN** the result table shows columns `s`, `p`, and `o` with up to 20 binding rows

#### Scenario: Operator submits a SPARQL Update
- **WHEN** the operator runs a query containing `INSERT DATA { ... }`
- **THEN** the system does not mutate the session graph and returns an error instead of result rows

### Requirement: Decisions workspace inspects recorded decision nodes
The Decisions workspace SHALL list session nodes of type `decision`. Operator input is an optional category filter and selection of a decision id. Each listed decision SHALL expose `decision_id`, `category`, `scenario`, `reasoning`, `outcome`, `confidence` (number), and `timestamp` (ISO-8601 string or null). Selecting a decision SHALL show its causal chain as ordered steps `{id, relationship, content, type}` and any precedent matches of the same decision shape.

#### Scenario: Operator opens a decision with a causal chain
- **WHEN** the session contains a decision node and the operator selects that decision
- **THEN** the workspace shows its outcome and confidence and a step-by-step causal chain for that decision id

### Requirement: Enrich import accepts JSON and CSV graphs
The Enrich workspace Import and Export tab SHALL accept one uploaded file of type `.json` or `.csv` (UTF-8, at most 50 MB). JSON input SHALL be either an object with `nodes` or `entities` plus `edges` or `relationships`, or an array of node objects, or an array of edge objects keyed with `source`/`target` (or `source_id`/`target_id` or `START_ID`/`END_ID`). CSV input SHALL be a headered table whose rows are nodes (`id` / `node_id` / `:ID`) or edges (`source` and `target`, or Neo4j `:START_ID` / `:END_ID`). Output SHALL be a success payload with integer `nodes_imported` and `edges_imported` counts.

#### Scenario: Operator imports ContextGraph JSON
- **WHEN** the operator uploads a `.json` file `{ "nodes": [...], "edges": [...] }` on Import and Export
- **THEN** the session gains those nodes and edges and the UI reports the imported node and edge counts

#### Scenario: Operator imports a CSV edge list
- **WHEN** the operator uploads a UTF-8 CSV with headers `source,target,type` and at least one data row
- **THEN** the session gains the corresponding edges and the UI reports the imported counts

### Requirement: Enrich export downloads JSON or CSV
The Enrich Import and Export tab SHALL export the session graph as a downloadable file. Operator input is the format choice `json` or `csv`. JSON output SHALL be an application/json object with `nodes` and `edges`. CSV output SHALL be a text/csv table of nodes and edges. The downloaded filename SHALL use the chosen extension.

#### Scenario: Operator exports JSON
- **WHEN** the operator chooses format `json` and starts export
- **THEN** the browser downloads `semantica_export.json` containing the session graph as a JSON object with `nodes` and `edges`

### Requirement: Enrich merge and resolution operate on node ids
The Enrich Diff and Merge tab SHALL take two node id strings (primary to keep, duplicate to remove) and merge the duplicate into the primary, returning the surviving id and how many edges were redirected. The Entity Resolution tab SHALL scan the session graph and return duplicate pairs `{entity_a, entity_b, score}` (score in 0–1) that the operator can merge with the same merge contract. The Registry tab SHALL show a chronological audit of import, export, merge, and related mutations recorded in the current browser session.

#### Scenario: Operator merges a duplicate into a primary
- **WHEN** the operator submits a primary node id that exists and a duplicate node id that exists
- **THEN** the duplicate is removed, its unique properties and edges move onto the primary, and the UI reports the surviving id and redirected edge count

### Requirement: Manage lineage exports PROV-O reports
The Manage workspace SHALL include a PROV-O Lineage tab. Operator input is a node id. Output SHALL be a lineage diagram grouped into Agent, Activity, and Entity lanes. The operator SHALL be able to download a provenance report for that node as `json` (`application/json`) or `markdown` (`text/markdown`).

#### Scenario: Operator downloads a Markdown lineage report
- **WHEN** the operator looks up an existing node id on PROV-O Lineage and downloads format `markdown`
- **THEN** the browser downloads a Markdown file named with that node id and a `.md` suffix

### Requirement: Ontology Hub loads RDF ontologies and SHACL Turtle
The Ontology Hub workspace SHALL load ontologies from a URL, an uploaded file, or a create-from-scratch flow. Accepted file extensions SHALL include `.ttl`, `.rdf`, `.owl`, `.nt`, `.jsonld`, `.json`, `.xml`, and `.n3`. SHACL Studio input and output SHALL be SHACL shapes in Turtle. Health output SHALL be a structured issue list that can deep-link an entity into the visual editor. Alignments output SHALL be records relating two ontology entities.

#### Scenario: Operator loads a Turtle ontology file
- **WHEN** the operator uploads a `.ttl` ontology on Ontology Hub Registry
- **THEN** the hub lists that ontology in the registry and the editor can open its entities

#### Scenario: Operator validates SHACL Turtle
- **WHEN** the operator submits SHACL shapes as Turtle in SHACL Studio against the loaded ontology
- **THEN** the hub returns a validation result for those shapes without requiring a different RDF syntax for the shapes text

### Requirement: Published docs match the rail catalog
The Knowledge Explorer sections of `README.md` and `explorer/README.md` SHALL document every rail control (`SKE` plus the six workspace buttons) with usage plus input and output content and formats that match the requirements above. Those tables MUST use the rail labels, not an inner-feature list that omits Analyze, Enrich, or Manage as first-class workspaces.

#### Scenario: Explorer README lists Analyze with SPARQL and reasoning I/O
- **WHEN** an operator reads the Workspaces section of `explorer/README.md`
- **THEN** they see an Analyze row that names Reasoning Playground and SPARQL Querying and states the fact/rule text format and the SPARQL table result shape

#### Scenario: Root README does not replace rail names with inner tabs
- **WHEN** an operator reads the Knowledge Explorer workspace table in `README.md`
- **THEN** the table rows use the rail labels Knowledge Explorer, Analyze, Decisions, Enrich, Manage, and Ontology Hub rather than listing only Timeline, Registry, or Entity Resolution as top-level workspaces
