## Why

Operators see the Explorer app rail (SKE, Knowledge Explorer, Analyze, Decisions, Enrich, Manage, Ontology Hub) but the published workspace tables in `README.md` and `explorer/README.md` name inner features (Timeline, Registry, Entity Resolution) instead of those buttons, and they never state each workspace's input and output content or format. That gap is the question this change answers: how each rail control is used, and what goes in and out.

## What Changes

- Publish an operator-facing **app-rail catalog** that maps every rail control to its workspace, tabs, how to use it, and the live input/output content and formats (observed from `explorer/src/App.tsx` and the Explorer API).
- Replace the outdated "Workspaces" tables in `README.md` (Knowledge Explorer section) and `explorer/README.md` so they follow the rail, not a mixed feature list.
- Keep the catalog aligned with current behavior: do not add formats, APIs, or workspace tabs in this change. UI copy (workspace subtitles/kickers) may be tightened only where it already exists and contradicts the catalog.
- **Non-goals:** redesigning the rail, adding in-app help panels, changing import/export/SPARQL/ontology APIs, or overlapping `explorer-canvas-first-chrome` (graph canvas chrome).

## Capabilities

### New Capabilities

- `explorer-app-rail`: Operator catalog of the Explorer left rail and each workspace's usage plus input/output contracts, and the requirement that published docs match that catalog.

### Modified Capabilities

- None. `openspec/specs/` currently has no published capabilities. The in-flight `explorer-graph-workspace` delta (canvas-first chrome) is a different surface and is not modified here.

## Impact

- Documentation: `README.md` Knowledge Explorer section; `explorer/README.md` Workspaces section.
- Frontend copy only if a workspace subtitle/kicker currently contradicts the catalog (`explorer/src/App.tsx`).
- Tests: a focused docs/UI alignment check that the published rail catalog lists the same button ids/labels as `navItems` in `App.tsx`, plus format strings that match the live import/export and query surfaces.
- No API, graph-store, or session-schema changes.
