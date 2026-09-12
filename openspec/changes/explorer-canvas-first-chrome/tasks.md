## 1. Scene stage overlay

- [x] 1.1 Remove the in-flow `explore-command-deck` from above `explore-main-grid` in `GraphWorkspace.tsx` and host command chrome as an overlay on `explore-scene-shell`, then confirm the Sigma stage fills the remaining workspace below app/workspace tabs when the inspector is open and no plugin dock is shown
- [x] 1.2 Stop mounting `TimelinePanel` as a persistent in-flow 90px `explore-scene-footer` and overlay temporal chrome on the bottom of `explore-scene-shell`, then confirm idle layout no longer leaves a stacked footer band under the canvas
- [x] 1.3 Limit overlay pointer-events to compact rows and expanded panels (no full-scene invisible hit layer) and confirm Sigma pan/zoom/select still work on the unobscured `.sigma-mouse` area
- [x] 1.4 Keep the plugin dock in-flow only while a panel is open and confirm closing it restores scene height without an empty chrome strip

## 2. Command chrome

- [x] 2.1 Collapse status chips, search affordance, view-mode icons, tool clusters, and legend summary into one compact top row with `aria-expanded`, then confirm idle chrome is a single row rather than the previous stacked deck
- [x] 2.2 Expand the command dropdown on hover and `focus-within`, keep it open while the pointer is in the panel, and collapse on leave when no numeric draft is pending; confirm search, Full Graph / Grouped View / Focus, Camera/Layout/Analysis/Utility tools, and `.explore-color-legend-item` appear in the expanded dropdown
- [x] 2.3 Hold numeric chrome values (ego-depth hops and any other overlay numeric fields) as drafts with Confirm applying them and collapsing the row, then confirm dragging a range does not collapse the dropdown and Escape discards the draft without applying it
- [x] 2.4 Pin-expand command chrome on coarse-pointer tap and collapse on outside tap, Confirm, or Escape, then confirm a touch/coarse path can open and close the dropdown without relying on hover

## 3. Temporal chrome

- [x] 3.1 Render a collapsed bottom row with `#temporal-play-btn` and the `YYYY/MM` playhead label, then confirm Play/Pause works without expanding the full vis-timeline
- [x] 3.2 Expand the vis-timeline overlay on hover/focus (measure or keep a laid-out host so vis-timeline does not init at 0 height) and collapse after leave with no pending draft; confirm the expanded scrubber does not permanently shrink Sigma canvas allocation
- [x] 3.3 Add Confirm for a playhead change so the new time applies and the temporal chrome recedes to the compact row, then confirm Escape/leave without confirm restores the prior applied playhead for dismiss purposes

## 4. Hovered bidirectional edge labels

- [x] 4.1 Add a pure `labelSide` assignment for a hovered node's lit incident edges so A→B and B→A land on opposite normals, then confirm unit tests cover bidirectional split, unidirectional single-side, and no invented reverse label
- [x] 4.2 Implement a custom Sigma `defaultDrawEdgeLabel` in `sigmaNativeRendering.ts` that offsets chips off the stroke with a minimum gap, then confirm a short/near-axis pair still does not overlap
- [x] 4.3 Force hovered incident edges to `arrow` / `curvedArrow` in `resolveStraightEdgeType` / the edgeReducer regardless of overview contextual-arrow LOD, then confirm both directions keep visible arrowheads and `npm run test:graph-workspace` still passes existing edge-style tests

## 5. Tests

- [x] 5.1 Update `explorer/tests/graphColorLegend.e2e.ts` to expand command chrome before querying `.explore-color-legend-item` and confirm `npm run test:graph-legend-e2e` still passes
- [x] 5.2 Add GraphWorkspace chrome tests covering collapsed one-row idle state, hover/focus expand, Confirm/Escape numeric drafts, and temporal compact play, then confirm they run under `npm run test:graph-workspace`
- [x] 5.3 Build Explorer with `npm run build` in `explorer/` and confirm TypeScript/Vite succeed after the overlay and edge-label changes
