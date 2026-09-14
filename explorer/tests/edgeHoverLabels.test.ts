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

test("directed reverse edge with lex ±side lands on opposite geometric side", () => {
  // Mirrors Sigma: each directed edge passes its own S→T coordinates, while
  // assignIncidentEdgeLabelSides tags lex(source<source) as +1 / reverse as -1.
  const a = { x: 0, y: 0 };
  const b = { x: 120, y: 0 };
  const sides = assignIncidentEdgeLabelSides({
    hoveredNodeId: "odysseus",
    edges: [
      { id: "fwd", source: "odysseus", target: "penelope" },
      { id: "rev", source: "penelope", target: "odysseus" },
    ],
  });
  const fwd = resolveBidirectionalLabelPlacement({
    source: a,
    target: b,
    side: sides.get("fwd") ?? 1,
    labelWidth: 80,
    labelHeight: 18,
    minGap: 10,
    sourceId: "odysseus",
    targetId: "penelope",
  });
  const rev = resolveBidirectionalLabelPlacement({
    source: b,
    target: a,
    side: sides.get("rev") ?? 1,
    labelWidth: 80,
    labelHeight: 18,
    minGap: 10,
    sourceId: "penelope",
    targetId: "odysseus",
  });
  assert.notEqual(fwd.y, rev.y);
  assert.equal(
    labelBoxesOverlap(
      { x: fwd.x - 40, y: fwd.y - 9, width: 80, height: 18 },
      { x: rev.x - 40, y: rev.y - 9, width: 80, height: 18 },
    ),
    false,
  );
});

test("without id remapping, directed ±side collapses onto one side (regression guard)", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 120, y: 0 };
  const brokenFwd = resolveBidirectionalLabelPlacement({
    source: a,
    target: b,
    side: 1,
    labelWidth: 80,
    labelHeight: 18,
    minGap: 10,
  });
  const brokenRev = resolveBidirectionalLabelPlacement({
    source: b,
    target: a,
    side: -1,
    labelWidth: 80,
    labelHeight: 18,
    minGap: 10,
  });
  // Same geometric side when normals flip with the edge and sides are ±1.
  assert.equal(brokenFwd.y, brokenRev.y);
});

test("same signed curvature on reverse directed edges still splits labels", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 160, y: 0 };
  const pos = resolveBidirectionalLabelPlacement({
    source: a,
    target: b,
    side: 1,
    labelWidth: 96,
    labelHeight: 18,
    minGap: 10,
    sourceId: "person_odysseus",
    targetId: "unknown_suitors",
    curvature: 0.18,
  });
  const neg = resolveBidirectionalLabelPlacement({
    source: b,
    target: a,
    side: -1,
    labelWidth: 96,
    labelHeight: 18,
    minGap: 10,
    sourceId: "unknown_suitors",
    targetId: "person_odysseus",
    curvature: 0.18,
  });
  assert.ok(pos.y * neg.y < 0);
  assert.equal(
    labelBoxesOverlap(
      { x: pos.x - 48, y: pos.y - 9, width: 96, height: 18 },
      { x: neg.x - 48, y: neg.y - 9, width: 96, height: 18 },
    ),
    false,
  );
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
