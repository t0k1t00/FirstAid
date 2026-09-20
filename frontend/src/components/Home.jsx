import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { getAllIncidents } from '../db/incidents';
import { findClusters } from '../lib/cluster';
import { getPriority } from '../lib/priority';
import { guides, SEVERITY_LABELS } from '../guides';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSystemStatus } from '../hooks/useSystemStatus';
import GuidanceConsole from './GuidanceConsole';
import IncidentMap from './IncidentMap';
import IncidentDetailDrawer from './IncidentDetailDrawer';
import ResponderHandoff from './ResponderHandoff';
import Icon from '../icons/Icon';

export default function Home() {
  const online = useOnlineStatus();
  const { pendingCount } = useSystemStatus();
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [handoffIncident, setHandoffIncident] = useState(null);
  const [mapFilter, setMapFilter] = useState('all');
  const remote = Boolean(API_BASE_URL);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (remote) {
          const res = await fetch(`${API_BASE_URL}/incidents`, { cache: 'no-store' });
          if (res.ok && !cancelled) setIncidents((await res.json()).incidents ?? []);
        } else if (!cancelled) {
          setIncidents(await getAllIncidents());
        }
      } catch {
        // The dashboard remains the authoritative coordination view.
      }
    }
    load();
    const refresh = () => load();
    window.addEventListener('firstaidflow:incident-created', refresh);
    const timer = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('firstaidflow:incident-created', refresh); };
  }, [remote]);

  const filteredMapIncidents = useMemo(() => incidents.filter((incident) => {
    if (mapFilter === 'all') return true;
    if (mapFilter === 'clusters') return true;
    return getPriority(incident).level === mapFilter;
  }), [incidents, mapFilter]);
  const clusters = useMemo(() => findClusters(incidents), [incidents]);
  const openCount = incidents.filter((i) => !i.resolved).length;
  const criticalCount = incidents.filter((i) => !i.resolved && getPriority(i).level === 'critical').length;

  const selectMapItem = (incident) => setSelected(incident);
  const toggleResolved = async (incident) => {
    if (remote) return;
    const { setResolvedLocally } = await import('../db/incidents');
    await setResolvedLocally(incident.id, !incident.resolved);
    setIncidents(await getAllIncidents());
    setSelected((current) => current?.id === incident.id ? { ...current, resolved: !incident.resolved } : current);
  };

  return (
    <main className="page-wide home-page">
      {!online && (
        <p className="offline-banner">
          <Icon name="cloud" size={14} /> Offline guidance mode. Verified first-aid guides and incident logging
          remain available; incidents queue locally and synchronize automatically when connectivity returns.
        </p>
      )}

      <div className="home-grid">
        <div className="home-primary"><GuidanceConsole /></div>
        <aside className="home-status-panel">
          <div className="status-panel-title">EMERGENCY STATUS</div>
          <dl className="status-panel-list">
            <div><dt>System</dt><dd className={online ? 'text-healthy' : 'text-degraded'}>{online ? 'Online' : 'Offline'}</dd></div>
            <div><dt>Data mode</dt><dd>{remote ? 'Cloud' : 'This device'}</dd></div>
            <div><dt>Local queue</dt><dd>{pendingCount}</dd></div>
            <div><dt>Open incidents</dt><dd>{openCount}</dd></div>
            <div><dt>Critical</dt><dd className={criticalCount > 0 ? 'text-degraded' : undefined}>{criticalCount}</dd></div>
          </dl>
          <Link to="/dashboard" className="btn-ghost status-panel-link">Open Response Dashboard <Icon name="chevronRight" size={14} /></Link>
        </aside>
      </div>

      <section className="home-map-section">
        <div className="section-heading">
          <div><Icon name="location" size={16} /><h2>Live Incident Map</h2></div>
          <span className="map-live-state"><span className="sys-status-dot" aria-hidden="true" /> {online ? 'LIVE' : 'LOCAL'}</span>
        </div>
        <div className="home-map-toolbar" role="toolbar" aria-label="Incident map filters">
          {[
            ['all', 'All'], ['critical', 'Critical'], ['high', 'High'], ['clusters', 'Clusters'],
          ].map(([value, label]) => (
            <button key={value} type="button" className={`map-filter ${mapFilter === value ? 'map-filter--active' : ''}`} onClick={() => setMapFilter(value)}>
              {label}
            </button>
          ))}
          <span className="map-toolbar-meta">{filteredMapIncidents.length} mapped incidents · {clusters.length} possible clusters</span>
        </div>
        <IncidentMap
          incidents={filteredMapIncidents}
          clusters={mapFilter === 'clusters' ? clusters : clusters}
          selectedId={selected?.id}
          onSelect={selectMapItem}
          showClusters={mapFilter !== 'critical' && mapFilter !== 'high'}
        />
        {mapFilter === 'clusters' && clusters.length > 0 && (
          <div className="map-cluster-list">
            {clusters.map((cluster, index) => (
              <button key={index} type="button" className="map-cluster-card" onClick={() => setSelected(cluster.members[0])}>
                <span className="map-cluster-count">{cluster.size}</span>
                <span><strong>Possible emergency cluster</strong><small>{cluster.spanKm} km · {cluster.spanMinutes} min</small></span>
                <Icon name="chevronRight" size={14} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-guides-section">
        <div className="section-heading"><div><Icon name="shieldCheck" size={16} /><h2>Verified quick guides</h2></div></div>
        <p className="page-sub">Source-backed decision trees. Skip the assistant and go straight to the steps.</p>
        <div className="quick-guide-row">
          {guides.map((g) => (
            <Link key={g.id} to={`/guide/${g.id}`} className={`quick-guide-chip sev-${g.severity_color}`}>
              <Icon name={g.icon} size={18} /><span>{g.title}</span><span className="quick-guide-sev">{SEVERITY_LABELS[g.severity]}</span>
            </Link>
          ))}
        </div>
      </section>

      <IncidentDetailDrawer
        incident={selected}
        onClose={() => setSelected(null)}
        onShare={(incident) => setHandoffIncident(incident)}
        onToggleResolved={toggleResolved}
        canToggleResolved={!remote}
      />
      {handoffIncident && <ResponderHandoff incident={handoffIncident} onClose={() => setHandoffIncident(null)} />}
    </main>
  );
}
