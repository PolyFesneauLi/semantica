## Context

See `proposal.md` for motivation. Locked visual: preview 1 (canvas-first idle overlay, inspector stays). Graph Explore currently stacks `explore-command-deck` above `explore-main-grid` and pins `TimelinePanel` to a 90px in-flow footer (`GraphWorkspace.tsx`, `TimelinePanel.tsx`). Sigma already observes container size. Command widgets already exist; ego depth is a live range. Bidirectional pairs already get opposite curvature in `resolveEdgeCurvature`, but Sigma's default edge-label drawer still paints both `data.label`s on the stroke midline (`GraphCanvas` edgeReducer), so hovered A→B / B→A texts stack. Arrows are contextual and often `line` at overview (`resolveStraightEdgeType`). No published main spec exists for this capability.

## Goals / Non-Goals

**Goals:**
- Reparent command and temporal chrome as scene overlays so the Sigma stage is the remaining first-page surface (preview 1).
- One compact row each (top command, bottom temporal); hover/focus expands a dropdown; Confirm commits numeric drafts and recedes.
- On node hover, lit bidirectional labels sit on opposite sides of the line with clear arrows and no occlusion.
- Preserve command capabilities and Sigma hit-testing on the unobscured canvas.
- Update tests that assume a permanently visible legend, 90px timeline, or midline-stacked bidirectional labels.

**Non-Goals:**
- No layout-worker, graph-store schema, or API changes.
- No inspector redesign; it keeps its side column (preview 1).
- No rewrite of vis-timeline internals beyond chrome density and overlay hosting.
- No global Explorer tab-bar redesign.
- Do not invent reverse relationships that are not in the graph.

## Decisions

### Overlay chrome instead of a thinner stacked deck
Keep `explore-shell` as a single scene stage. Absolutely position a top command overlay and a bottom temporal overlay on `explore-scene-shell` (glass HUD, pointer-events only on chrome). Do not keep a persistent in-flow command deck or 90px footer.

Alternatives considered:
- Reduce padding/gaps only: still leaves a multi-row deck; does not meet “maximum canvas”.
- Auto-hide chrome completely: hides status and play; fails the “still reachable” requirement.

### Hover expands; Confirm recedes; focus-within and dirty drafts pin
Collapsed rows expand on `pointerenter` / `focus-within`. Collapse on leave with a short delay so the pointer can travel into the dropdown. While a numeric draft is dirty, ignore hover-leave until Confirm or Escape. Confirm applies and forces collapsed even if the pointer is still over the row; a later hover can re-expand. Escape discards the draft and collapses. Coarse pointers (touch) tap-to-pin instead of hover.

Alternatives considered:
- Click-only expand: contradicts the requested hover dropdown.
- Collapse on any mouseleave during slider drag: would fight the “fill numbers then confirm” flow.

### Numeric drafts are chrome-owned values, applied on Confirm
Ego-depth hops (and any other numeric fields that live in the command overlay) use a local draft. The graph keeps the last confirmed value until Confirm. Range dragging updates the draft only. Temporal playhead can preview while expanded; Confirm commits `onTimeChange` if the implementation currently streams every drag — prefer commit-on-confirm for the overlay dismiss, while Play on the compact row continues to use the already-applied playhead.

Alternatives considered:
- Live-apply plus a cosmetic Done button: easier, but Confirm would not be a real commit and Escape could not discard.

### Plugin dock stays explicitly opened in-flow
Effects/Neighbors content is a deliberate workspace, not idle chrome. When the operator opens a dock panel, it may consume scene height (Sigma already resizes). Closing it restores the overlay-only stage. Do not fold the full effects panel into the one-line command row.

### Compact row contents
Top row: status chips (truncated if needed), search affordance, view-mode icons, icon-only tool clusters, legend summary (count or first swatches). Full labels, search field, legend list, and numeric drafts live in the dropdown. Bottom row: circular play/pause + `YYYY/MM` label; expanded overlay hosts the existing vis-timeline.

### Hovered bidirectional labels use a perpendicular offset, not a second edge
Keep the existing pair (two directed edges, opposite curvature). Add a pure function that, for a hovered node's lit incident edges, assigns `labelSide` (`+normal` / `-normal`) from directedness so A→B and B→A never share a side. Draw labels with a custom Sigma `defaultDrawEdgeLabel` in `sigmaNativeRendering.ts` (offset along the edge normal, clamp so chips stay off the stroke and off each other). While that node is hovered, force those incident edges to `arrow` / `curvedArrow` regardless of overview contextual-arrow policy. Unidirectional lit edges get one side only. Do not merge the pair into a single undirected stroke.

Alternatives considered:
- One shared label listing both types: hides direction and fails “two descriptions”.
- Only increase curvature: labels still collide at midpoints on near-straight segments.

### Accessibility
Collapsed rows are always in the tab order. Expanded panels set `aria-expanded`. Overlay must not cover the full scene with an invisible hit layer. Existing `aria-label`s on tools and `#temporal-play-btn` stay. Edge labels remain visual-only; inspector still lists the relationships.

## Risks / Trade-offs

- [Hover vs canvas] → Overlay hit targets limited to compact rows and expanded panels; Sigma `.sigma-mouse` keeps the rest of the stage.
- [Legend e2e looks for `.explore-color-legend-item` while collapsed] → Expand (or query after hover) in `graphColorLegend.e2e.ts`; keep the class names.
- [vis-timeline init at 0 height] → Mount/measure the timeline when first expanded, or keep a visually collapsed but laid-out host; do not destroy it on every collapse.
- [Touch devices ignore hover] → Tap-to-pin is specified; verify with a coarse-pointer path in tests or manual check.
- [Confirm vs live temporal streaming] → If snapshot requests already fire on every playhead move, keep preview streaming while expanded and still require Confirm to collapse; do not add a second time model.
- [Near-horizontal/vertical edges still collide] → Offset along a stable screen-space normal and add a minimum pixel gap from measured text boxes; if the pair is too short, slide labels toward opposite thirds of the segment.
- [Overview hides arrows] → Hovered incident edges force `arrow`/`curvedArrow`; other edges keep current LOD.

## Migration Plan

Ship as a frontend-only Explorer layout and edge-label change. Rollback is reverting overlay CSS/JSX plus the custom edge-label drawer. No data migration. Update Playwright/unit selectors in the same change so CI does not depend on the old stacked deck or midline-stacked labels.

## Open Questions

None that change specs or task breakdown. Exact collapsed-row icon packing can be decided during implementation as long as one-row height and the listed commands remain reachable.
