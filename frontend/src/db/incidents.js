import { openDB } from 'idb';

const DB_NAME = 'firstaidflow';
const DB_VERSION = 1;
const STORE = 'incidents';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        // IndexedDB cannot index booleans, so `synced` is stored as 0 / 1.
        store.createIndex('by-synced', 'synced');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // Fallback for very old WebViews: RFC 4122 v4 shape.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Persist a new incident locally. Works with or without connectivity. */
export async function addIncident(incident) {
  const db = await getDB();
  const record = { ...incident, synced: 0, synced_at: null, sync_attempts: 0, last_error: null };
  await db.add(STORE, record);
  return record;
}

/** Local-only toggle. Use resolveIncidentRemotely when an API is configured. */
export async function setResolvedLocally(id, resolved) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  const record = await tx.store.get(id);
  if (record) {
    record.resolved = resolved;
    await tx.store.put(record);
  }
  await tx.done;
}

/** Bulk-insert already-formed records (used to load the labelled demo dataset). */
export async function addDemoIncidents(records) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  for (const record of records) {
    await tx.store.put({ synced: 1, synced_at: record.timestamp, sync_attempts: 0, last_error: null, ...record });
  }
  await tx.done;
}

export async function clearAllIncidents() {
  const db = await getDB();
  await db.clear(STORE);
}

export async function getUnsyncedIncidents() {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'by-synced', 0);
}

/** Newest first. Used by the dashboard when no API is configured. */
export async function getAllIncidents() {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE, 'by-timestamp');
  return all.reverse();
}

/** Mark as synced. The record is kept so the device has its own history. */
export async function markIncidentSynced(id, syncedAt) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  const record = await tx.store.get(id);
  if (record) {
    record.synced = 1;
    record.synced_at = syncedAt;
    record.last_error = null;
    await tx.store.put(record);
  }
  await tx.done;
}

/**
 * Human-readable sync state for the dashboard/incident list.
 * synced: 1 = Synced, -1 = Failed (permanently rejected), 0 = Pending/Syncing.
 * We don't persist a separate "syncing" flag; the sync manager keeps that
 * transient in memory, so 0 + sync_attempts > 0 reads as "retrying".
 */
export function getSyncStatus(record) {
  if (record.synced === 1) return 'Synced';
  if (record.synced === -1) return 'Failed';
  if ((record.sync_attempts || 0) > 0) return 'Retrying';
  return 'Pending';
}

export async function recordSyncAttempt(id, error, { permanent = false } = {}) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  const record = await tx.store.get(id);
  if (record) {
    record.sync_attempts = (record.sync_attempts || 0) + 1;
    record.last_error = error;
    // A permanent (4xx) rejection is parked so it stops blocking the queue.
    if (permanent) record.synced = -1;
    await tx.store.put(record);
  }
  await tx.done;
}
