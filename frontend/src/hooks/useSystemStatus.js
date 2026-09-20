import { useEffect, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { getSyncState, SYNC_EVENT } from '../sync/syncManager';
import { getUnsyncedIncidents } from '../db/incidents';

/**
 * Combines browser connectivity with the sync manager's live state into one
 * status the UI can animate through:
 *   online -> offline -> reconnecting -> syncing -> synced -> online
 */
export function useSystemStatus() {
  const online = useOnlineStatus();
  const [sync, setSync] = useState(getSyncState());
  const [pendingCount, setPendingCount] = useState(0);
  const [transient, setTransient] = useState(null); // 'reconnecting' | 'synced' | null

  useEffect(() => {
    const onSync = (e) => setSync(e.detail);
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUnsyncedIncidents().then((list) => {
      if (!cancelled) setPendingCount(list.length);
    });
    return () => {
      cancelled = true;
    };
  }, [sync]);

  // Brief "reconnecting" pulse right as connectivity returns, before the
  // sync manager reports its own phase.
  useEffect(() => {
    if (online) {
      setTransient('reconnecting');
      const t = setTimeout(() => setTransient(null), 900);
      return () => clearTimeout(t);
    }
    setTransient(null);
  }, [online]);

  let phase = 'online';
  if (!online) phase = 'offline';
  else if (transient === 'reconnecting' && sync.phase !== 'syncing') phase = 'reconnecting';
  else if (sync.phase === 'syncing') phase = 'syncing';
  else if (sync.phase === 'complete' && sync.synced > 0) phase = 'synced';

  return { online, phase, pendingCount, sync };
}
