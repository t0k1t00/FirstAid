import { useSystemStatus } from '../hooks/useSystemStatus';

const LABELS = {
  online: 'ONLINE',
  reconnecting: 'CONNECTING',
  offline: 'OFFLINE',
  syncing: 'SYNCING',
  synced: 'SYNC COMPLETE',
};

/** Persistent system-status widget. Lives in the app shell, always visible. */
export default function SystemStatus({ compact = false }) {
  const { phase, pendingCount, sync } = useSystemStatus();

  const detail = (() => {
    if (phase === 'offline') return 'Emergency guidance available';
    if (phase === 'syncing') return `Syncing ${sync.synced}/${sync.total}`;
    if (phase === 'synced') return 'All incidents synchronized';
    if (phase === 'reconnecting') return 'Restoring connection\u2026';
    return pendingCount > 0 ? `${pendingCount} queued locally` : 'All systems nominal';
  })();

  return (
    <div className={`sys-status sys-status--${phase}${compact ? ' sys-status--compact' : ''}`} role="status" aria-live="polite">
      <span className="sys-status-dot" aria-hidden="true" />
      <div className="sys-status-text">
        <span className="sys-status-label">{LABELS[phase]}</span>
        {!compact && <span className="sys-status-detail">{detail}</span>}
      </div>
      {!compact && pendingCount > 0 && phase !== 'syncing' && (
        <span className="sys-status-queue">Local queue: {pendingCount}</span>
      )}
    </div>
  );
}
