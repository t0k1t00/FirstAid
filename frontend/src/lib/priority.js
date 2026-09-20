// Deterministic, explainable coordinator priority. No ML, no diagnosis —
// purely a mapping from the severity/resolved fields the responder already
// selected while walking a guide.
//
// Every priority is derivable from a single sentence a coordinator can read
// and trust: it says what determined it.

const SEVERITY_PRIORITY = {
  'life-threatening': 'critical',
  urgent: 'high',
  moderate: 'medium',
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const REASONS = {
  critical: 'Critical \u2014 life-threatening condition selected by responder.',
  high: 'High \u2014 urgent condition selected by responder.',
  medium: 'Medium \u2014 moderate-severity condition selected by responder.',
  low: 'Low \u2014 incident marked resolved on-device before sync.',
};

/** Returns { level, reason }. Never claims a diagnosis, only reports input. */
export function getPriority(incident) {
  let level = SEVERITY_PRIORITY[incident.severity] || 'medium';
  // A responder-confirmed resolved incident that isn't life-threatening is
  // downgraded — it still needs a record, not urgent coordinator attention.
  if (incident.resolved && level !== 'critical') level = 'low';
  return { level, reason: REASONS[level] };
}

export function sortByPriority(incidents) {
  return [...incidents].sort((a, b) => {
    const pa = PRIORITY_ORDER[getPriority(a).level];
    const pb = PRIORITY_ORDER[getPriority(b).level];
    if (pa !== pb) return pa - pb;
    return (b.timestamp || '').localeCompare(a.timestamp || '');
  });
}

export const PRIORITY_LABELS = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
