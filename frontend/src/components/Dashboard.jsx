import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { guides, SEVERITY_COLORS, SEVERITY_LABELS, getInjuryLabel } from '../guides';
import {
  getAllIncidents,
  getSyncStatus,
  addDemoIncidents,
  clearAllIncidents,
  setResolvedLocally,
} from '../db/incidents';
import { getPriority, sortByPriority, PRIORITY_LABELS } from '../lib/priority';
import { findClusters } from '../lib/cluster';
import { detectSurge } from '../lib/surge';
import { DEMO_INCIDENTS } from '../demo/demoIncidents';
import IncidentMap from './IncidentMap';
import ClusterAlert from './ClusterAlert';
import SurgeAlert from './SurgeAlert';
import CoordinationHealth from './CoordinationHealth';
import IncidentDetailDrawer from './IncidentDetailDrawer';
import ResponderHandoff from './ResponderHandoff';

const REFRESH_MS = 15_000;
const DEFAULT_FILTERS = { severity: 'all', type: 'all', status: 'all', since: 'all' };
const SINCE_MS = { '1h': 3600e3, '24h': 86400e3, '7d': 7 * 86400e3 };

// Coordinator view. No auth by design for the hackathon (see README).
export default function Dashboard() {
  const remote = Boolean(API_BASE_URL);
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const [handoffIncident, setHandoffIncident] = useState(null);

  const load = useCallback(async () => {
    try {
      let list;
      if (remote) {
        const res = await fetch(`${API_BASE_URL}/incidents`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        list = (await res.json()).incidents ?? [];
      } else {
        list = await getAllIncidents();
      }
      setIncidents(list);
      setStatus('ready');
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }, [remote]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => applyFilters(incidents, filters), [incidents, filters]);
  const clusters = useMemo(() => findClusters(filtered), [filtered]);
  const surge = useMemo(() => detectSurge(incidents), [incidents]);
  const sorted = useMemo(() => sortByPriority(filtered), [filtered]);
  const summary = useMemo(() => summarize(incidents, clusters, surge), [incidents, clusters, surge]);

  const [resolveError, setResolveError] = useState(null);

  const toggleResolved = async (incident) => {
    const nextResolved = !incident.resolved;
    const nextStatus = nextResolved ? 'resolved' : 'open';
    setResolveError(null);

    if (remote) {
      try {
        const res = await fetch(`${API_BASE_URL}/incidents/${incident.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        // Only update local state after confirmed server persistence.
        await load();
        setSelected((s) => (s && s.id === incident.id ? { ...s, resolved: nextResolved } : s));
      } catch (err) {
        setResolveError(`Could not update incident: ${err.message}`);
      }
    } else {
      await setResolvedLocally(incident.id, nextResolved);
      await load();
      setSelected((s) => (s && s.id === incident.id ? { ...s, resolved: nextResolved } : s));
    }
  };

  return (
    <main className="page dashboard-page">
      <header className="response-header">
        <div>
          <p className="eyebrow">EMERGENCY OPERATIONS</p>
          <h1>Response Center</h1>
        </div>
        <div className="response-header-meta">
          <span className={`sys-status sys-status--${status === 'error' ? 'offline' : 'online'}`}>
            <span className="sys-status-dot" aria-hidden="true" />
            {status === 'error' ? 'DEGRADED' : 'ONLINE'}
          </span>
          <span className="response-header-sync">
            {updatedAt ? `Last synchronization: ${relativeSeconds(updatedAt)} ago` : '\u2014'}
          </span>
          <button type="button" className="btn-ghost" onClick={load}>Refresh</button>
        </div>
      </header>

      {!remote && (
        <p className="notice">
          No API configured (VITE_API_BASE_URL is empty). Showing incidents stored on this device.
          {' '}
          <DemoDataControls onChange={load} />
        </p>
      )}
      {status === 'error' && (
        <p className="error">
          Could not load incidents ({error}).{incidents.length > 0 && ' Showing last known data.'}
        </p>
      )}

      <OperationalSummary summary={summary} />

      {clusters.map((cluster, idx) => (
        <ClusterAlert key={idx} cluster={cluster} />
      ))}
      <SurgeAlert surge={surge} />

      <IncidentMap incidents={filtered} clusters={clusters} selectedId={selected?.id} onSelect={setSelected} />

      <CoordinationHealth incidents={incidents} remote={remote} />

      <Filters filters={filters} setFilters={setFilters} />

      {status === 'loading' && <p className="empty">Loading…</p>}
      {status !== 'loading' && sorted.length === 0 && <p className="empty">No incidents match these filters.</p>}

      <ul className="incident-list">
        {sorted.map((incident) => (
          <IncidentRow
            key={incident.id}
            incident={incident}
            remote={remote}
            onOpen={() => setSelected(incident)}
          />
        ))}
      </ul>

      {resolveError && (
        <p className="error" role="alert">{resolveError}</p>
      )}
      <IncidentDetailDrawer
        incident={selected}
        onClose={() => { setSelected(null); setResolveError(null); }}
        onShare={(incident) => setHandoffIncident(incident)}
        onToggleResolved={toggleResolved}
        canToggleResolved={true}
      />
      {handoffIncident && (
        <ResponderHandoff incident={handoffIncident} onClose={() => setHandoffIncident(null)} />
      )}
    </main>
  );
}

function summarize(incidents, clusters, surge) {
  const critical = incidents.filter((i) => getPriority(i).level === 'critical' && !i.resolved).length;
  const open = incidents.filter((i) => !i.resolved).length;
  return { critical, open, clusters: clusters.length, surgePct: surge.pctChange };
}

function OperationalSummary({ summary }) {
  const items = [
    { label: 'CRITICAL', value: summary.critical, accent: 'critical' },
    { label: 'OPEN', value: summary.open, accent: 'open' },
    { label: 'CLUSTERS', value: summary.clusters, accent: 'clusters' },
    {
      label: 'SURGE',
      value: `${summary.surgePct >= 0 ? '\u2191' : '\u2193'} ${Math.abs(summary.surgePct)}%`,
      accent: 'surge',
    },
  ];
  return (
    <div className="op-summary">
      {items.map((item) => (
        <div key={item.label} className="op-summary-item">
          <div className={`op-summary-value op-summary-value--${item.accent}`}>{item.value}</div>
          <div className="op-summary-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function Filters({ filters, setFilters }) {
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  return (
    <div className="filters">
      <select value={filters.severity} onChange={set('severity')} aria-label="Filter by severity">
        <option value="all">All severities</option>
        {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <select value={filters.type} onChange={set('type')} aria-label="Filter by incident type">
        <option value="all">All types</option>
        {guides.map((g) => (
          <option key={g.id} value={g.id}>{g.title}</option>
        ))}
        <option value="general">General (AI-assessed)</option>
      </select>
      <select value={filters.status} onChange={set('status')} aria-label="Filter by status">
        <option value="all">All statuses</option>
        <option value="open">Open</option>
        <option value="resolved">Resolved</option>
      </select>
      <select value={filters.since} onChange={set('since')} aria-label="Filter by time">
        <option value="all">Any time</option>
        <option value="1h">Last hour</option>
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
      </select>
      {(filters.severity !== 'all' || filters.type !== 'all' || filters.status !== 'all' || filters.since !== 'all') && (
        <button type="button" className="btn-ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear</button>
      )}
    </div>
  );
}

function applyFilters(incidents, filters) {
  return incidents.filter((i) => {
    if (filters.severity !== 'all' && i.severity !== filters.severity) return false;
    if (filters.type !== 'all' && i.injury_type !== filters.type) return false;
    if (filters.status !== 'all') {
      const isResolved = Boolean(i.resolved);
      if (filters.status === 'open' && isResolved) return false;
      if (filters.status === 'resolved' && !isResolved) return false;
    }
    if (filters.since !== 'all') {
      const age = Date.now() - new Date(i.timestamp).getTime();
      if (!(age <= SINCE_MS[filters.since])) return false;
    }
    return true;
  });
}

function IncidentRow({ incident, remote, onOpen }) {
  const guide = getInjuryLabel(incident.injury_type);
  const color = SEVERITY_COLORS[incident.severity] || 'yellow';
  const hasLocation = typeof incident.lat === 'number' && typeof incident.lng === 'number';
  const priority = getPriority(incident);
  const syncStatus = remote ? 'Synced' : getSyncStatus(incident);

  return (
    <li className={`incident sev-${color}`}>
      <button type="button" className="incident-row-button" onClick={onOpen}>
        <span className="incident-bar" aria-hidden="true" />
        <div className="incident-body">
          <div className="incident-top-row">
            <span className="incident-type">{guide}</span>
            <span className={`priority-badge priority-${priority.level}`} title={priority.reason}>
              {PRIORITY_LABELS[priority.level]}
            </span>
          </div>
          <div className="incident-meta">
            {formatTime(incident.timestamp)} · {incident.severity} ·{' '}
            {hasLocation ? `${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}` : 'location unavailable'}
          </div>
          <div className="incident-meta incident-sync-row">
            <span className={`sync-badge sync-${syncStatus.toLowerCase()}`}>{syncStatus}</span>
          </div>
        </div>
        <span className={`badge ${incident.resolved ? 'resolved' : ''}`}>
          {incident.resolved ? 'Resolved' : 'Open'}
        </span>
      </button>
    </li>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function relativeSeconds(date) {
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.round(s / 60)}m`;
}

// Only rendered when no API is configured — loads/clears a clearly-labelled
// demo dataset straight into this device's IndexedDB. Never touches the
// backend, so it is safe to demo with or without AWS deployed.
function DemoDataControls({ onChange }) {
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    await addDemoIncidents(DEMO_INCIDENTS);
    setBusy(false);
    onChange();
  };
  const clear = async () => {
    setBusy(true);
    await clearAllIncidents();
    setBusy(false);
    onChange();
  };
  return (
    <span className="demo-controls">
      <button type="button" className="btn-ghost btn-tiny" onClick={load} disabled={busy}>Load demo data</button>
      <button type="button" className="btn-ghost btn-tiny" onClick={clear} disabled={busy}>Clear</button>
    </span>
  );
}
