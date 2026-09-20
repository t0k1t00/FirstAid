import { useState } from 'react';
import { getInjuryLabel } from '../guides';
import { getPriority } from '../lib/priority';

/** Operational handoff modal: a copyable/shareable brief for another responder. */
export default function ResponderHandoff({ incident, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!incident) return null;

  const guideTitle = getInjuryLabel(incident.injury_type);
  const priority = getPriority(incident);
  const hasLocation = typeof incident.lat === 'number' && typeof incident.lng === 'number';
  const brief = buildBrief(incident, guideTitle, priority, hasLocation);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
    } catch {
      // Clipboard API can be denied; the text is still visible to select manually.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Responder handoff', text: brief });
        return;
      } catch {
        // User cancelled or Web Share unavailable; fall through to copy.
      }
    }
    copy();
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="handoff-title" onClick={onClose}>
      <div className="sheet handoff-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 id="handoff-title">RESPONDER HANDOFF</h2>
        <div className="handoff-divider" />
        <dl className="handoff-fields">
          <div><dt className={`priority-text-${priority.level}`}>{priority.level.toUpperCase()}</dt><dd>{guideTitle}</dd></div>
          <div><dt>LOCATION</dt><dd>{hasLocation ? 'Approximate location available' : 'Not available'}</dd></div>
          <div><dt>REPORTED</dt><dd>{formatTime(incident.timestamp)}</dd></div>
          <div><dt>STATUS</dt><dd>{incident.resolved ? 'RESOLVED' : 'OPEN'}</dd></div>
          <div><dt>PRIORITY REASON</dt><dd>{priority.reason}</dd></div>
        </dl>
        <div className="handoff-divider" />

        <div className="row">
          <button type="button" className="btn-option" onClick={copy}>{copied ? 'Copied \u2713' : 'Copy Brief'}</button>
          <button type="button" className="btn-primary" onClick={share}>Share</button>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Close</button>
      </div>
    </div>
  );
}

function buildBrief(incident, guideTitle, priority, hasLocation) {
  const lines = [
    `${priority.level.toUpperCase()} — ${guideTitle}`,
    `Incident ID: ${incident.id?.slice(0, 8) ?? 'n/a'}`,
    `Location: ${hasLocation ? `${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}` : 'unavailable'}`,
    `Reported: ${formatTime(incident.timestamp)}`,
    `Status: ${incident.resolved ? 'Resolved' : 'Open'}`,
    `Priority reason: ${priority.reason}`,
  ];
  if (incident.description) lines.push(`Reported situation: ${incident.description}`);
  return lines.join('\n');
}

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
