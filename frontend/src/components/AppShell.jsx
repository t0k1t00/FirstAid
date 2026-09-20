import { NavLink, Link, useLocation } from 'react-router-dom';
import SystemStatus from './SystemStatus';
import Icon from '../icons/Icon';
import { EMERGENCY_NUMBER } from '../config';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/guide', label: 'Guides', icon: 'guide', match: '/guide' },
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/sources', label: 'Sources', icon: 'sources' },
];

/** Global app shell: nav rail on desktop, bottom nav on mobile, top bar with
 * live system status and quick emergency access everywhere. */
export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const isActiveItem = (to, match) => (match ? pathname.startsWith(match) : pathname === to);

  return (
    <div className="shell">
      <aside className="shell-rail" aria-label="Primary navigation">
        <div className="shell-rail-brand">
          <span className="brand-mark" aria-hidden="true">+</span>
        </div>
        <nav className="shell-rail-nav">
          {NAV_ITEMS.map(({ to, label, icon, match }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`rail-item${isActiveItem(to, match) ? ' rail-item--active' : ''}`}
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="shell-rail-status">
          <SystemStatus compact />
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <Link to="/" className="shell-brand">
            <span className="brand-mark" aria-hidden="true">+</span>
            <span className="shell-brand-text">FIRSTAIDFLOW</span>
          </Link>
          <div className="shell-topbar-status">
            <SystemStatus compact />
          </div>
          <a className="shell-emergency-chip" href={`tel:${EMERGENCY_NUMBER}`}>
            <Icon name="phone" size={14} />
            {EMERGENCY_NUMBER}
          </a>
        </header>

        <div className="shell-content">{children}</div>

        <nav className="shell-bottom-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ to, label, icon, match }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`bottom-nav-item${isActiveItem(to, match) ? ' bottom-nav-item--active' : ''}`}
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
