export type EdgeLabelSide = 1 | -1;

export type IncidentEdgeRef = {
  id: string;
  source: string;
  target: string;
};

export function undirectedPairKey(source: string, target: string): string {
  return source < target ? `${source}\t${target}` : `${target}\t${source}`;
}

export function assignIncidentEdgeLabelSides(args: {
  hoveredNodeId: string;
  edges: IncidentEdgeRef[];
}): Map<string, EdgeLabelSide> {
  const sides = new Map<string, EdgeLabelSide>();
  const hoveredNodeId = args.hoveredNodeId;
  if (!hoveredNodeId) {
    return sides;
  }

  const incident = args.edges.filter(
    (edge) => edge.source === hoveredNodeId || edge.target === hoveredNodeId,
  );
  const groups = new Map<string, IncidentEdgeRef[]>();
  for (const edge of incident) {
    const key = undirectedPairKey(edge.source, edge.target);
    const list = groups.get(key);
    if (list) {
      list.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }

  for (const group of groups.values()) {
    const forward = group.filter((edge) => edge.source < edge.target);
    const reverse = group.filter((edge) => edge.source > edge.target);
    const bidirectional = forward.length > 0 && reverse.length > 0;
    if (bidirectional) {
      for (const edge of forward) {
        sides.set(edge.id, 1);
      }
      for (const edge of reverse) {
        sides.set(edge.id, -1);
      }
      continue;
    }
    for (const edge of group) {
      sides.set(edge.id, 1);
    }
  }

  return sides;
}

export function offsetPointAlongNormal(args: {
  source: { x: number; y: number };
  target: { x: number; y: number };
  side: EdgeLabelSide;
  gap: number;
  alongT?: number;
}): { x: number; y: number; angle: number; length: number } {
  const dx = args.target.x - args.source.x;
  const dy = args.target.y - args.source.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const t = args.alongT ?? 0.5;
  return {
    x: args.source.x + dx * t + nx * args.gap * args.side,
    y: args.source.y + dy * t + ny * args.gap * args.side,
    angle: Math.atan2(dy, dx),
    length,
  };
}

export function resolveBidirectionalLabelPlacement(args: {
  source: { x: number; y: number };
  target: { x: number; y: number };
  side: EdgeLabelSide;
  labelWidth: number;
  labelHeight: number;
  minGap: number;
}): { x: number; y: number; angle: number } {
  const length = Math.hypot(args.target.x - args.source.x, args.target.y - args.source.y);
  const alongT = length < args.labelWidth * 2
    ? (args.side === 1 ? 0.38 : 0.62)
    : 0.5;
  const gap = Math.max(args.minGap, args.labelHeight / 2 + 6);
  const point = offsetPointAlongNormal({
    source: args.source,
    target: args.target,
    side: args.side,
    gap,
    alongT,
  });
  return { x: point.x, y: point.y, angle: point.angle };
}

export function labelBoxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 0,
): boolean {
  return !(
    a.x + a.width + padding <= b.x
    || b.x + b.width + padding <= a.x
    || a.y + a.height + padding <= b.y
    || b.y + b.height + padding <= a.y
  );
}
