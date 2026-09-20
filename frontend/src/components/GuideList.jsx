import { useState } from 'react';
import { Link } from 'react-router-dom';
import { guideById } from '../guides';
import { TAXONOMY, GROUPS } from '../lib/emergencyTaxonomy';
import Icon from '../icons/Icon';

const URGENCY_COLOR = { critical: 'red', high: 'orange', moderate: 'yellow', low: 'green' };
const URGENCY_LABEL = { critical: 'Critical', high: 'High', moderate: 'Moderate', low: 'Low' };

export default function GuideList() {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);

  const q = search.toLowerCase().trim();

  const filtered = TAXONOMY.filter((cat) => {
    if (cat.id === 'general') return false;
    if (activeGroup && cat.group !== activeGroup) return false;
    if (q) {
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.keywords.some((k) => k.includes(q))
      );
    }
    return true;
  });

  // Group the filtered list
  const grouped = {};
  for (const cat of filtered) {
    if (!grouped[cat.group]) grouped[cat.group] = [];
    grouped[cat.group].push(cat);
  }

  const groupKeys = Object.keys(GROUPS).filter((g) => grouped[g]?.length > 0);

  return (
    <main className="page guide-list-page">
      <header className="page-header">
        <p className="eyebrow">EMERGENCY REFERENCE</p>
        <h1>52 emergency scenarios</h1>
        <p className="page-sub">
          27 verified step-by-step guides · 13 escalation-only categories · Works fully offline.
        </p>
      </header>

      <div className="guide-search-bar">
        <Icon name="search" size={16} className="guide-search-icon" />
        <input
          type="search"
          className="guide-search-input"
          placeholder="Search scenarios…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search emergency scenarios"
        />
        {search && (
          <button type="button" className="guide-search-clear btn-ghost btn-tiny" onClick={() => setSearch('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      <div className="guide-group-filters" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={`chip${!activeGroup ? ' chip--active' : ''}`}
          onClick={() => setActiveGroup(null)}
        >
          All
        </button>
        {Object.entries(GROUPS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip${activeGroup === key ? ' chip--active' : ''}`}
            onClick={() => setActiveGroup(activeGroup === key ? null : key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="guide-no-results">No scenarios match "{search}".</p>
      ) : (
        groupKeys.map((groupKey) => (
          <section key={groupKey} className="guide-group">
            <h2 className="guide-group-heading">{GROUPS[groupKey]}</h2>
            <div className="guide-grid">
              {grouped[groupKey].map((cat) => {
                const guide = cat.guideId ? guideById[cat.guideId] : null;
                const hasGuide = Boolean(guide);
                return (
                  hasGuide ? (
                    <Link key={cat.id} to={`/guide/${cat.guideId}`} className={`guide-card sev-${URGENCY_COLOR[cat.urgency]}`}>
                      <div className="guide-card-top">
                        <span className={`guide-urgency-dot urgency-${cat.urgency}`} aria-hidden="true" />
                        <span className="guide-urgency-label">{URGENCY_LABEL[cat.urgency]}</span>
                        <span className="guide-type-badge guide-type-badge--verified">Verified guide</span>
                      </div>
                      <span className="guide-title">{cat.name}</span>
                      {cat.requiresEmergencyServices && (
                        <span className="guide-ems-indicator"><Icon name="phone" size={11} /> Call emergency services</span>
                      )}
                    </Link>
                  ) : (
                    <div key={cat.id} className={`guide-card guide-card--escalation sev-${URGENCY_COLOR[cat.urgency]}`}>
                      <div className="guide-card-top">
                        <span className={`guide-urgency-dot urgency-${cat.urgency}`} aria-hidden="true" />
                        <span className="guide-urgency-label">{URGENCY_LABEL[cat.urgency]}</span>
                        <span className="guide-type-badge guide-type-badge--escalation">Emergency services</span>
                      </div>
                      <span className="guide-title">{cat.name}</span>
                      <span className="guide-ems-indicator"><Icon name="phone" size={11} /> Call emergency services immediately</span>
                    </div>
                  )
                );
              })}
            </div>
          </section>
        ))
      )}

      <p className="guide-list-footer">
        First-aid guidance only. Always prioritise calling emergency services for life-threatening situations.
      </p>
    </main>
  );
}
