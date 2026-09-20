import Icon from '../icons/Icon';

/** Operational surge signal — appears only while actually surging. */
export default function SurgeAlert({ surge }) {
  if (!surge.isSurging) return null;
  return (
    <div className="op-alert op-alert--surge" role="status">
      <Icon name="trendUp" size={18} className="op-alert-icon" />
      <div className="op-alert-body">
        <div className="op-alert-title">INCIDENT SURGE</div>
        <p className="op-alert-note">
          {surge.recentCount} incidents in the last {surge.windowMinutes} min · {surge.pctChange >= 0 ? '+' : ''}
          {surge.pctChange}% vs. the previous window
        </p>
      </div>
    </div>
  );
}
