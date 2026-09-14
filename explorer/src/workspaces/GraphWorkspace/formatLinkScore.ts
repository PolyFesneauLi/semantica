export function formatLinkScore(score: number): string {
  if (!Number.isFinite(score)) return "—";
  if (score >= 0 && score <= 1) return `${(score * 100).toFixed(1)}%`;
  return score.toFixed(1);
}
