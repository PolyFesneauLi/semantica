## Why

The Graph Explore first screen currently stacks a multi-row command deck above the Sigma canvas and a 90px temporal scrubber below it, so the graph itself occupies only a minority of the viewport. Operators need the canvas to dominate the first page (locked to preview 1: one compact overlay row, inspector stays) while still reaching commands on hover. When a node is hovered, lit bidirectional edges currently share a midline so the two relationship texts and arrows occlude each other.

## What Changes

- Overlay Graph Explore chrome on the Sigma scene so the canvas fills the remaining first-page stage. Idle layout matches preview 1: one compact top row, one compact bottom temporal row, right-hand inspector remains.
- Expand the compact top command row into a dropdown on hover (and equivalent keyboard focus). Numeric drafts stay open until Confirm; Confirm recedes the chrome to the compact row. Escape discards an unconfirmed draft.
- Collapse the bottom temporal strip the same way: play/pause + date in the compact row; hover expands the scrubber overlay without permanently shrinking the canvas.
- When the operator hovers a node, light its incident edges. For a bidirectional pair, place the two relationship descriptions on opposite sides of the connecting line, keep both arrowheads clearly visible, and prevent the two labels from overlapping.
- Plugin docks remain explicitly opened in-flow. No API or graph-store contract changes.

## Capabilities

### New Capabilities

- `explorer-graph-workspace`: Graph Explore first-page layout (canvas-first overlay chrome) and hovered-node bidirectional edge labeling (opposite-side texts, clear arrows, no occlusion).

### Modified Capabilities

- None. `openspec/specs/` currently has no published capabilities.

## Impact

- Frontend: `GraphWorkspace.tsx` (command deck → scene overlay), `TimelinePanel.tsx` (compact/expand overlay), `GraphCanvas.tsx` / `sigmaNativeRendering.ts` / `graphSceneState.ts` (hovered incident edges, arrow visibility, custom edge-label offset).
- Tests: `graphColorLegend.e2e.ts` must expand chrome before querying legend items; add chrome hover tests and bidirectional label-side assignment tests (extend `graphSceneState.display.test.ts` / `deterministicExplorerRendering.test.ts`).
- No API, graph store schema, layout worker, or inspector data-contract changes.
