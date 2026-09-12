import assert from "node:assert/strict";
import test from "node:test";

import {
  assignIncidentEdgeLabelSides,
  labelBoxesOverlap,
  resolveBidirectionalLabelPlacement,
  undirectedPairKey,
} from "../src/workspaces/GraphWorkspace/edgeHoverLabels.ts";
import { isOverlayExpanded } from "../src/workspaces/GraphWorkspace/exploreOverlayChrome.ts";

test("bidirectional pair splits labels onto opposite normals", () => {
  const sides = assignIncidentEdgeLabelSides({
    hoveredNodeId: "odysseus",
    edges: [
      { id: "fwd", source: "odysseus", target: "penelope" },
      { id: "rev", source: "penelope", target: "odysseus" },
      { id: "other", source: "ithaca", target: "troy" },
    ],
  });
  assert.equal(sides.get("fwd"), 1);
  assert.equal(sides.get("rev"), -1);
  assert.equal(sides.has("other"), false);
});

test("unidirectional incident edge stays single-sided and does not invent a reverse", () => {
  const sides = assignIncidentEdgeLabelSides({
    hoveredNodeId: "odysseus",
    edges: [
      { id: "rules", source: "odysseus", target: "ithaca" },
    ],
  });
  assert.equal(sides.size, 1);
  assert.equal(sides.get("rules"), 1);
});

test("pair keys are undirected so A-B and B-A group together", () => {
  assert.equal(undirectedPairKey("a", "b"), undirectedPairKey("b", "a"));
});

test("short near-axis bidirectional labels do not overlap", () => {
  const source = { x: 0, y: 0 };
  const target = { x: 40, y: 0 };
  const above = resolveBidirectionalLabelPlacement({
    source,
    target,
    side: 1,
    labelWidth: 72,
    labelHeight: 16,
    minGap: 10,
  });
  const below = resolveBidirectionalLabelPlacement({
    source,
    target,
    side: -1,
    labelWidth: 72,
    labelHeight: 16,
    minGap: 10,
  });
  assert.equal(
    labelBoxesOverlap(
      { x: above.x - 36, y: above.y - 8, width: 72, height: 16 },
      { x: below.x - 36, y: below.y - 8, width: 72, height: 16 },
    ),
    false,
  );
  assert.notEqual(above.y, below.y);
});

test("overlay stays collapsed until hover, focus, pin, or a dirty draft", () => {
  assert.equal(isOverlayExpanded({
    hovered: false,
    focused: false,
    pinned: false,
    dirtyDraft: false,
    forceCollapsed: false,
  }), false);
  assert.equal(isOverlayExpanded({
    hovered: true,
    focused: false,
    pinned: false,
    dirtyDraft: false,
    forceCollapsed: false,
  }), true);
  assert.equal(isOverlayExpanded({
    hovered: true,
    focused: false,
    pinned: false,
    dirtyDraft: true,
    forceCollapsed: true,
  }), false);
});
