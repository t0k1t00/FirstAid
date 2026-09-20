import { getInjuryLabel } from '../guides';
import Icon from '../icons/Icon';

/** Horizontal operational alert — explicitly labelled as unconfirmed. */
export default function ClusterAlert({ cluster, onView }) {
  const categories = cluster.categories.map((id) => getInjuryLabel(id));
  return (
    <div className="op-alert op-alert--cluster" role="alert">
      <Icon name="cluster" size={18} className="op-alert-icon" />
      <div className="op-alert-body">
        <div className="op-alert-title">POSSIBLE INCIDENT CLUSTER</div>
        <div className="op-alert-metrics">
          <span>{cluster.size} incidents</span>
          <span>{cluster.spanKm} km</span>
          <span>{cluster.spanMinutes} min</span>
        </div>
        <p className="op-alert-note">
          {categories.join(', ')} — based on time/location proximity only. Does
          not confirm the incidents are related.
        </p>
      </div>
      {onView && (
        <button type="button" className="btn-ghost op-alert-action" onClick={onView}>
          View Cluster <Icon name="chevronRight" size={14} />
        </button>
      )}
    </div>
  );
}
