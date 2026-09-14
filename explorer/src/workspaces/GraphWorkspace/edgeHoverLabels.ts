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

function curveControlPoint(args: {
  source: { x: number; y: number };
  target: { x: number; y: number };
  curvature: number;
}): { x: number; y: number } {
  const dx = args.target.x - args.source.x;
  const dy = args.target.y - args.source.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = length * args.curvature;
  return {
    x: (args.source.x + args.target.x) / 2 + nx * offset,
    y: (args.source.y + args.target.y) / 2 + ny * offset,
  };
}

function quadraticPoint(
  source: { x: number; y: number },
  control: { x: number; y: number },
  target: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * source.x + 2 * mt * t * control.x + t * t * target.x,
    y: mt * mt * source.y + 2 * mt * t * control.y + t * t * target.y,
  };
}

export function resolveBidirectionalLabelPlacement(args: {
  source: { x: number; y: number };
  target: { x: number; y: number };
  side: EdgeLabelSide;
  labelWidth: number;
  labelHeight: number;
  minGap: number;
  /**
   * Endpoint ids for the *directed* edge being drawn. Lex ±`side` from
   * {@link assignIncidentEdgeLabelSides} is remapped into this edge's own
   * S→T frame so reverse edges do not cancel into one geometric side.
   */
  sourceId?: string;
  targetId?: string;
  /** Sigma / theme curvature along this directed edge. */
  curvature?: number;
}): { x: number; y: number; angle: number } {
  const source = args.source;
  const target = args.target;
  const curvature = args.curvature ?? 0;
  // assignIncidentEdgeLabelSides tags sides in the undirected lex frame.
  // Directed drawing uses S→T normals; flip when this edge is lex-reversed.
  const displaySide: EdgeLabelSide = (
    args.sourceId && args.targetId && args.sourceId > args.targetId
      ? -args.side
      : args.side
  ) as EdgeLabelSide;

  const length = Math.hypot(target.x - source.x, target.y - source.y);
  const alongT = length < args.labelWidth * 2
    ? (args.side === 1 ? 0.34 : 0.66)
    : (args.side === 1 ? 0.4 : 0.6);
  const gap = Math.max(args.minGap, args.labelHeight + 10);

  if (Math.abs(curvature) > 1e-6) {
    const control = curveControlPoint({ source, target, curvature });
    const onCurve = quadraticPoint(source, control, target, alongT);
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const inv = Math.hypot(dx, dy) || 1;
    return {
      x: onCurve.x + (-dy / inv) * gap * displaySide,
      y: onCurve.y + (dx / inv) * gap * displaySide,
      angle: Math.atan2(dy, dx),
    };
  }

  const point = offsetPointAlongNormal({
    source,
    target,
    side: displaySide,
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
