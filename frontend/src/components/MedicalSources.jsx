import { Link } from 'react-router-dom';
import { guides } from '../guides';
import { GUIDE_SOURCES, MEDICAL_DISCLAIMER } from '../guides/sources';
import Icon from '../icons/Icon';

export default function MedicalSources() {
  return (
    <main className="page sources-page">
      <p className="eyebrow">MEDICAL GUIDANCE</p>
      <h1>Sources</h1>

      <ul className="sources-list">
        {guides.map((g) => (
          <li key={g.id}>
            <div className="src-title"><Icon name={g.icon} size={16} /> {g.title}</div>
            <div>{GUIDE_SOURCES[g.id] || 'Source not recorded.'}</div>
          </li>
        ))}
      </ul>

      <div className="disclaimer-box">{MEDICAL_DISCLAIMER}</div>

      <p style={{ marginTop: 20 }}>
        <Link to="/" className="btn-ghost btn-link">Back home</Link>
      </p>
    </main>
  );
}
