/**
 * Backend representation of all 52 valid category IDs.
 * Must stay in sync with frontend/src/lib/emergencyTaxonomy.js
 *
 * Urgency → server-side severity mapping is deterministic and never
 * derived from AI output or client-provided values.
 */

export const CATEGORY_URGENCY = {
  // Trauma & Injury
  'severe-bleeding':    'critical',
  'minor-cuts':         'moderate',
  'deep-wound':         'high',
  'puncture-wound':     'high',
  'amputation':         'critical',
  'crush-injury':       'critical',
  'fracture':           'high',
  'sprain-strain':      'moderate',
  'dislocation':        'high',
  'head-injury':        'high',
  'neck-spinal-injury': 'critical',
  'eye-injury':         'high',
  'foreign-object-eye': 'moderate',
  'nosebleed':          'moderate',
  'dental-injury':      'moderate',
  'animal-bite':        'high',
  'snake-bite':         'critical',
  'insect-bite-sting':  'moderate',
  // Burns & Environmental
  'thermal-burn':       'high',
  'chemical-burn':      'high',
  'electrical-burn':    'critical',
  'sunburn':            'moderate',
  'heat-exhaustion':    'high',
  'heat-stroke':        'critical',
  'hypothermia':        'high',
  'frostbite':          'high',
  // Breathing & Airway
  'choking':            'critical',
  'breathing-difficulty':'high',
  'asthma-emergency':   'high',
  'allergic-reaction':  'high',
  'anaphylaxis':        'critical',
  'smoke-inhalation':   'high',
  'drowning':           'critical',
  // Cardiac & Neurological
  'unconsciousness-cpr':'critical',
  'chest-pain':         'critical',
  'stroke-suspected':   'critical',
  'seizure':            'high',
  'fainting':           'moderate',
  'shock':              'critical',
  'severe-weakness':    'high',
  // Poisoning & Exposure
  'poisoning':          'high',
  'drug-overdose':      'critical',
  'chemical-exposure':  'high',
  'carbon-monoxide':    'critical',
  'unknown-ingestion':  'high',
  // Acute Medical
  'diabetic-emergency': 'high',
  'severe-dehydration': 'high',
  'severe-abdominal-pain':'high',
  'high-fever':         'moderate',
  'severe-headache':    'high',
  'panic-hyperventilation':'moderate',
  'general':            'moderate',
};

export const ALL_VALID_IDS = new Set(Object.keys(CATEGORY_URGENCY));

const URGENCY_TO_SEVERITY = {
  critical: 'life-threatening',
  high: 'urgent',
  moderate: 'moderate',
  low: 'moderate',
};

/**
 * Deterministically resolve server-side severity from category IDs.
 * Never trusts client-provided severity.
 */
export function resolveServerSeverity(categoryIds) {
  const ids = Array.isArray(categoryIds) ? categoryIds : [];
  const urgencyOrder = ['critical', 'high', 'moderate', 'low'];
  let best = 'moderate';
  for (const id of ids) {
    const urgency = CATEGORY_URGENCY[id];
    if (!urgency) continue;
    if (urgencyOrder.indexOf(urgency) < urgencyOrder.indexOf(best)) {
      best = urgency;
    }
  }
  return URGENCY_TO_SEVERITY[best] ?? 'moderate';
}

/**
 * Validate and filter category IDs against the allowlist.
 * Returns only valid IDs.
 */
export function filterValidCategories(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => ALL_VALID_IDS.has(id));
}
