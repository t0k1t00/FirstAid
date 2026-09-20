import { SEVERITY_COLORS } from '../guides';

const PAD = 24;
const W = 100;
const H = 70;

// Lightweight, dependency-free geographic view: normalizes lat/lng into an
// SVG viewbox. No third-party map tiles or API keys, so it never breaks the
// demo and never leaks precise coordinates — points are shown at
// neighbourhood precision, relative to each other only.
export default function IncidentMap({ incidents, clusters = [], selectedId, onSelect, showClusters = true }) {
  const located = incidents.filter(
    (i) => typeof i.lat === 'number' && typeof i.lng === 'number',
  );

  if (located.length === 0) {
    return (
      <div className="map-empty">
        No incidents with location data yet. The map still works without one —
        the list and filters below cover every incident.
      </div>
    );
  }

  const lats = located.map((i) => i.lat);
  const lngs = located.map((i) => i.lng);
  const latRange = Math.max(Math.max(...lats) - Math.min(...lats), 0.01);
  const lngRange = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.01);
  const minLat = Math.min(...lats);
  const minLng = Math.min(...lngs);

  const project = ({ lat, lng }) => ({
    x: PAD + ((lng - minLng) / lngRange) * (W - 2 * PAD),
    // Flip Y: higher latitude = further north = higher up on screen.
    y: PAD + (1 - (lat - minLat) / latRange) * (H - 2 * PAD),
  });

  return (
    <div className="incident-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Approximate incident locations">
        <rect x="0" y="0" width={W} height={H} className="map-bg" rx="4" />
        <g className="map-grid" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <line key={`v${i}`} x1={(W / 4) * i} y1="0" x2={(W / 4) * i} y2={H} />
          ))}
          {[1, 2].map((i) => (
            <line key={`h${i}`} x1="0" y1={(H / 3) * i} x2={W} y2={(H / 3) * i} />
          ))}
        </g>

        {showClusters && clusters.map((cluster, idx) => {
          const { x, y } = project(cluster.centroid);
          return <circle key={idx} cx={x} cy={y} r="9" className="map-cluster-halo" />;
        })}

        {located.map((i) => {
          const { x, y } = project(i);
          const color = SEVERITY_COLORS[i.severity] || 'yellow';
          const selected = i.id === selectedId;
          return (
            <circle
              key={i.id}
              cx={x}
              cy={y}
              r={selected ? 4.4 : i.severity === 'life-threatening' ? 3.2 : 2.4}
              className={`map-dot sev-${color}${selected ? ' map-dot--selected' : ''}`}
              onClick={() => onSelect?.(i)}
              tabIndex={onSelect ? 0 : undefined}
              role={onSelect ? 'button' : undefined}
            >
              <title>{`${i.injury_type} \u00b7 ${i.severity}`}</title>
            </circle>
          );
        })}
      </svg>
      <p className="map-caption">
        Approximate positions, relative to each other only — not a street map. Tap a point for detail.
      </p>
    </div>
  );
}
