import { API_BASE_URL } from '../config';
import { getUnsyncedIncidents, markIncidentSynced, recordSyncAttempt } from '../db/incidents';
import { toast } from '../ui/toast';

// Strategy: app-driven sync on load, on `online`, and on tab focus, with a
// timed retry. This is deliberately used instead of the Background Sync API
// because Safari / iOS does not support it and the demo must work on any phone.
// The POST is idempotent (server ignores duplicate ids) so retries are safe.

export const SYNC_EVENT = 'firstaidflow:sync-state';

let lastState = { phase: 'idle', pending: 0, synced: 0, total: 0, at: null };

/** Read-only snapshot for UI widgets. Also available live via SYNC_EVENT. */
export function getSyncState() {
  return lastState;
}

function emit(state) {
  lastState = { ...lastState, ...state, at: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: lastState }));
  }
}

const RETRY_MS = 30_000;
let inFlight = null;
let retryTimer = null;

export function syncPendingIncidents() {
  if (inFlight) return inFlight;
  inFlight = run().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run() {
  const pending = await getUnsyncedIncidents();
  if (pending.length === 0) {
    emit({ phase: 'idle', pending: 0, synced: 0, total: 0 });
    return { synced: 0, pending: 0 };
  }

  if (!navigator.onLine) {
    emit({ phase: 'offline', pending: pending.length, synced: 0, total: pending.length });
    return { synced: 0, pending: pending.length };
  }

  if (!API_BASE_URL) {
    // Backend not wired yet: keep everything queued and make it visible.
    console.info(`[sync] VITE_API_BASE_URL not set. ${pending.length} incident(s) queued locally.`, pending);
    emit({ phase: 'queued', pending: pending.length, synced: 0, total: pending.length });
    return { synced: 0, pending: pending.length };
  }

  emit({ phase: 'syncing', pending: pending.length, synced: 0, total: pending.length });

  let synced = 0;
  for (const incident of pending) {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(incident)),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await markIncidentSynced(incident.id, data.synced_at || new Date().toISOString());
        synced += 1;
        emit({ phase: 'syncing', pending: pending.length - synced, synced, total: pending.length });
        continue;
      }

      const message = `HTTP ${res.status}`;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        // Server rejected the payload; retrying will never succeed.
        console.warn(`[sync] incident ${incident.id} rejected: ${message}`);
        await recordSyncAttempt(incident.id, message, { permanent: true });
        continue;
      }
      throw new Error(message);
    } catch (err) {
      // Network or server failure: stop here and try again later.
      await recordSyncAttempt(incident.id, err.message);
      emit({ phase: 'error', pending: pending.length - synced, synced, total: pending.length });
      scheduleRetry();
      break;
    }
  }

  if (synced > 0) {
    toast(synced === 1 ? 'Incident synced' : `${synced} incidents synced`);
  }
  const remaining = pending.length - synced;
  emit({ phase: remaining === 0 ? 'complete' : 'error', pending: remaining, synced, total: pending.length });
  return { synced, pending: remaining };
}

function toPayload({ id, injury_type, categoryIds, severity, lat, lng, location_accuracy, location_timestamp, timestamp, resolved, source, description, location_note }) {
  return {
    id,
    injury_type,
    ...(Array.isArray(categoryIds) && categoryIds.length ? { categoryIds } : {}),
    severity,
    lat,
    lng,
    location_accuracy: location_accuracy ?? null,
    location_timestamp: location_timestamp ?? null,
    timestamp,
    resolved,
    ...(source ? { source } : {}),
    ...(description ? { description } : {}),
    ...(location_note ? { location_note } : {}),
  };
}

function scheduleRetry() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => syncPendingIncidents(), RETRY_MS);
}

/** Call once at app start. Returns a cleanup function. */
export function startSyncListeners() {
  const onOnline = () => syncPendingIncidents();
  const onVisible = () => {
    if (document.visibilityState === 'visible') syncPendingIncidents();
  };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  syncPendingIncidents();

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    clearTimeout(retryTimer);
  };
}
