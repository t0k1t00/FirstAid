import { getSyncStatus } from '../db/incidents';

const STALE_HOURS = 2;

/** Compact system-monitoring view of the incident pipeline's health. */
export default function CoordinationHealth({ incidents, remote }) {
  const total = incidents.length;
  const withLocation = incidents.filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number').length;
  const coveragePct = total === 0 ? 0 : Math.round((withLocation / total) * 100);

  const openQueue = remote ? 0 : incidents.filter((i) => getSyncStatus(i) !== 'Synced').length;
  const failed = remote ? 0 : incidents.filter((i) => getSyncStatus(i) === 'Failed').length;
  const staleIncidents = incidents.filter(
    (i) => !i.resolved && Date.now() - new Date(i.timestamp).getTime() > STALE_HOURS * 3600e3,
  ).length;

  const syncHealthy = failed === 0;

  return (
    <div className="coord-health">
      <div className="coord-health-title">COORDINATION HEALTH</div>
      <div className="coord-health-grid">
        <div className="coord-metric">
          <div className="coord-metric-label">DATA COVERAGE</div>
          <div className="coverage-bar" aria-hidden="true">
            <span style={{ width: `${coveragePct}%` }} />
          </div>
          <div className="coord-metric-value">{coveragePct}%</div>
        </div>
        <div className="coord-metric">
          <div className="coord-metric-label">OPEN QUEUE</div>
          <div className="coord-metric-value">{openQueue}</div>
        </div>
        <div className="coord-metric">
          <div className="coord-metric-label">STALE INCIDENTS</div>
          <div className="coord-metric-value">{staleIncidents}</div>
        </div>
        <div className="coord-metric">
          <div className="coord-metric-label">SYNC</div>
          <div className={`coord-metric-value ${syncHealthy ? 'text-healthy' : 'text-degraded'}`}>
            {syncHealthy ? 'HEALTHY' : 'DEGRADED'}
          </div>
        </div>
        <div className="coord-metric">
          <div className="coord-metric-label">LOCAL DATA</div>
          <div className="coord-metric-value">{remote ? '\u2014' : total}</div>
        </div>
        <div className="coord-metric">
          <div className="coord-metric-label">CLOUD DATA</div>
          <div className="coord-metric-value">{remote ? total : '\u2014'}</div>
        </div>
      </div>
    </div>
  );
}
