import { getInjuryLabel } from '../guides';
import { getPriority } from '../lib/priority';
import Icon from '../icons/Icon';

/** Side drawer with incident detail + entry point into responder handoff. */
export default function IncidentDetailDrawer({ incident, onClose, onShare, onToggleResolved, canToggleResolved }) {
  if (!incident) return null;
  const priority = getPriority(incident);
  const hasLocation = typeof incident.lat === 'number' && typeof incident.lng === 'number';

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className={`incident-drawer priority-border-${priority.level}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={16} />
        </button>

        <p className={`drawer-kicker priority-text-${priority.level}`}>
          {priority.level.toUpperCase()} INCIDENT
        </p>
        <h2 id="drawer-title">{getInjuryLabel(incident.injury_type)}</h2>
        <p className="drawer-time mono">
          {incident.id?.slice(0, 8)} · {formatTime(incident.timestamp)} · {relativeTime(incident.timestamp)}
        </p>

        {incident.description && (
          <div className="drawer-section">
            <p className="drawer-section-label">REPORTED SITUATION</p>
            <p className="drawer-description">{incident.description}</p>
          </div>
        )}

        <dl className="drawer-fields">
          <div>
            <dt>LOCATION</dt>
            <dd>
              {hasLocation ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${incident.lat}&mlon=${incident.lng}#map=15/${incident.lat}/${incident.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Approximate location ({incident.lat.toFixed(3)}, {incident.lng.toFixed(3)})
                </a>
              ) : (incident.location_note ? `Landmark: ${incident.location_note}` : 'Location unavailable')}
            </dd>
          </div>
          {hasLocation && typeof incident.location_accuracy === 'number' && (
            <div><dt>LOCATION ACCURACY</dt><dd>Approx. {Math.round(incident.location_accuracy)} m</dd></div>
          )}
          {incident.location_note && (
            <div><dt>LANDMARK</dt><dd>{incident.location_note}</dd></div>
          )}
          <div>
            <dt>GUIDANCE PATHWAY</dt>
            <dd>{getInjuryLabel(incident.injury_type)}</dd>
          </div>
          <div>
            <dt>STATUS</dt>
            <dd>{incident.resolved ? 'Resolved' : 'Open'}</dd>
          </div>
          <div>
            <dt>PRIORITY</dt>
            <dd>{priority.level.charAt(0).toUpperCase() + priority.level.slice(1)}</dd>
          </div>
          <div>
            <dt>REASON</dt>
            <dd>{priority.reason}</dd>
          </div>
          {incident.source && (
            <div>
              <dt>SOURCE</dt>
              <dd>{incident.source === 'ai-guidance' ? 'Emergency Guidance Assistant' : 'Verified guide'}</dd>
            </div>
          )}
        </dl>

        <div className="drawer-actions">
          <button type="button" className="btn-option" onClick={() => onShare(incident)}>
            <Icon name="message" size={15} /> Open Handoff Brief
          </button>
          {hasLocation && (
            <a
              className="btn-option btn-link"
              href={`https://www.openstreetmap.org/directions?to=${incident.lat}%2C${incident.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="navigation" size={15} /> Get Directions
            </a>
          )}
          <button
            type="button"
            className="btn-option"
            onClick={() => onToggleResolved(incident)}
            disabled={!canToggleResolved}
          >
            <Icon name="check" size={15} /> {incident.resolved ? 'Reopen' : 'Mark Resolved'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function relativeTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.round(hr / 24)} d ago`;
}
