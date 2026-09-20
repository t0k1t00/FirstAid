import { useState } from 'react';
import { logIncident } from '../incidents/logIncident';

/**
 * Bottom sheet: "Log this incident?". Optional and never blocking; the
 * skip path is a single tap and exits immediately.
 */
export default function LogPrompt({ guide, resolved, onClose }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await logIncident({ guide, resolved });
      onClose(true);
    } catch (err) {
      console.error('[incident] failed to save locally', err);
      onClose(false);
    }
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="log-title">
      <div className="sheet">
        <h2 id="log-title">Log this incident?</h2>
        <p>
          Saves the injury type, time, and rough location on this phone. It reaches
          coordinators automatically when you are back online. Optional.
        </p>
        <button type="button" className="btn-primary" onClick={confirm} disabled={busy}>
          {busy ? 'Saving\u2026' : 'Yes, log it'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => onClose(false)} disabled={busy}>
          No thanks
        </button>
      </div>
    </div>
  );
}
