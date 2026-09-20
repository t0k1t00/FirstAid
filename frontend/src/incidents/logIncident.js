import { addIncident, newId } from '../db/incidents';
import { syncPendingIncidents } from '../sync/syncManager';
import { toast } from '../ui/toast';
import { TAXONOMY_BY_ID, URGENCY_TO_SEVERITY } from '../lib/emergencyTaxonomy';

const GEO_TIMEOUT_MS = 5000;

/**
 * Store an incident locally right now, then kick off a sync attempt.
 * Never throws on geolocation problems: lat/lng are simply null.
 */
export async function logIncident({ guide, resolved }) {
  const position = await getPositionOrNull();

  // Derive categoryIds from the guide being followed
  const categoryIds = [guide.id];
  const cat = TAXONOMY_BY_ID[guide.id];
  const severity = cat
    ? (URGENCY_TO_SEVERITY[cat.urgency] ?? 'moderate')
    : guide.severity ?? 'moderate';

  const incident = await addIncident({
    id: newId(),
    injury_type: guide.id,        // legacy compat
    categoryIds,                   // v7 field
    severity,
    lat: position?.lat ?? null,
    lng: position?.lng ?? null,
    location_accuracy: position?.accuracy ?? null,
    location_timestamp: position?.timestamp ?? null,
    timestamp: new Date().toISOString(),
    resolved: Boolean(resolved),
    source: 'guide',
  });

  toast(navigator.onLine ? 'Incident saved' : 'Saved offline. Will sync when back online.');
  syncPendingIncidents();
  window.dispatchEvent(new CustomEvent('firstaidflow:incident-created', { detail: incident }));
  return incident;
}

/**
 * Create an incident from the Emergency Guidance Assistant.
 */
export async function createIncidentFromGuidance({ category, categoryIds, severity, description, position, locationNote }) {
  const resolvedCategoryIds = categoryIds ?? (category ? [category] : ['general']);
  const resolvedCategory = resolvedCategoryIds[0] ?? 'general';

  const incident = await addIncident({
    id: newId(),
    injury_type: resolvedCategory,     // legacy compat
    categoryIds: resolvedCategoryIds,   // v7 field
    severity: severity ?? 'moderate',
    lat: position?.lat ?? null,
    lng: position?.lng ?? null,
    location_accuracy: position?.accuracy ?? null,
    location_timestamp: position?.timestamp ?? null,
    timestamp: new Date().toISOString(),
    resolved: false,
    source: 'ai-guidance',
    description: description ? String(description).slice(0, 500) : null,
    location_note: locationNote ? String(locationNote).slice(0, 160) : null,
  });

  toast(navigator.onLine ? 'Incident created' : 'Saved offline. Will sync when back online.');
  syncPendingIncidents();
  window.dispatchEvent(new CustomEvent('firstaidflow:incident-created', { detail: incident }));
  return incident;
}

function getPositionOrNull() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    let settled = false;
    const finish = (value) => { if (!settled) { settled = true; resolve(value); } };
    const guard = setTimeout(() => finish(null), GEO_TIMEOUT_MS + 1000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(guard); finish({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null, timestamp: new Date().toISOString() }); },
      () => { clearTimeout(guard); finish(null); },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 5 * 60 * 1000 },
    );
  });
}
