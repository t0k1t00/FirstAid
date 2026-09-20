// Deterministic incident clustering: time + geographic proximity, no ML.
// Groups incidents that happened close together in both space and time,
// labelled explicitly as a *potential* cluster for a human coordinator to
// investigate — never a confirmed emergency.

const EARTH_RADIUS_KM = 6371;

function haversineKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Union-find over incidents with a known location, linking any pair within
 * `radiusKm` and `windowMinutes` of each other. Returns clusters of size >= minSize.
 */
export function findClusters(
  incidents,
  { radiusKm = 1.5, windowMinutes = 20, minSize = 3 } = {},
) {
  const located = incidents
    .filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number' && i.timestamp)
    .map((i) => ({ ...i, _t: new Date(i.timestamp).getTime() }))
    .filter((i) => !Number.isNaN(i._t));

  const parent = located.map((_, idx) => idx);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const windowMs = windowMinutes * 60 * 1000;
  for (let a = 0; a < located.length; a++) {
    for (let b = a + 1; b < located.length; b++) {
      if (Math.abs(located[a]._t - located[b]._t) > windowMs) continue;
      if (haversineKm(located[a], located[b]) > radiusKm) continue;
      union(a, b);
    }
  }

  const groups = new Map();
  located.forEach((incident, idx) => {
    const root = find(idx);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(incident);
  });

  return [...groups.values()]
    .filter((g) => g.length >= minSize)
    .map((members) => {
      const times = members.map((m) => m._t);
      const lats = members.map((m) => m.lat);
      const lngs = members.map((m) => m.lng);
      const spanKm = maxPairwiseKm(members);
      const spanMinutes = Math.round((Math.max(...times) - Math.min(...times)) / 60000);
      const categories = [...new Set(members.map((m) => m.injury_type))];
      return {
        members,
        size: members.length,
        centroid: { lat: avg(lats), lng: avg(lngs) },
        spanKm: Math.round(spanKm * 10) / 10,
        spanMinutes,
        categories,
      };
    })
    .sort((a, b) => b.size - a.size);
}

function maxPairwiseKm(members) {
  let max = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      max = Math.max(max, haversineKm(members[i], members[j]));
    }
  }
  return max;
}

function avg(nums) {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
