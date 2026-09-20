// Deterministic surge detection: compares incident volume in a recent
// window against the window immediately before it. No ML — just counts.
export function detectSurge(incidents, { windowMinutes = 20 } = {}) {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const withTime = incidents
    .map((i) => ({ ...i, _t: new Date(i.timestamp).getTime() }))
    .filter((i) => !Number.isNaN(i._t));

  const recent = withTime.filter((i) => now - i._t <= windowMs).length;
  const previous = withTime.filter(
    (i) => now - i._t > windowMs && now - i._t <= windowMs * 2,
  ).length;

  const pctChange = previous === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - previous) / previous) * 100);

  return {
    windowMinutes,
    recentCount: recent,
    previousCount: previous,
    pctChange,
    isSurging: recent >= 3 && pctChange >= 25,
  };
}
