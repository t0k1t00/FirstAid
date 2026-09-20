import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { guideById, getStep } from '../guides';
import { EMERGENCY_NUMBER } from '../config';
import LogPrompt from './LogPrompt';

export default function GuideWalkthrough() {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const guide = guideById[guideId];

  // History stack of step ids; Back pops, so branching is always reversible.
  const [history, setHistory] = useState(() => (guide ? [guide.start] : []));
  // null | { resolved: boolean, exitAfter: boolean }
  const [prompt, setPrompt] = useState(null);
  const [logged, setLogged] = useState(false);

  if (!guide) {
    return (
      <main className="page guide-page">
        <section className="step">
          <p className="step-prompt">Guide not found.</p>
        </section>
        <footer className="step-actions">
          <Link to="/guide" className="btn-primary btn-link">Back to guides</Link>
        </footer>
      </main>
    );
  }

  const step = getStep(guide, history[history.length - 1]);
  const isTerminal = step.type === 'terminal';
  const stepCount = history.length;
  const totalEstimate = Math.max(guide.steps.length, stepCount);

  const goTo = (nextId) => setHistory((h) => [...h, nextId]);
  const goBack = () => (history.length > 1 ? setHistory((h) => h.slice(0, -1)) : navigate('/guide'));
  const restart = () => setHistory([guide.start]);

  const exitGuide = () => {
    // Offer to log once if they actually got somewhere. Skipping still exits.
    if (logged || history.length <= 1) {
      navigate('/guide');
      return;
    }
    setPrompt({ resolved: isTerminal, exitAfter: true });
  };

  const closePrompt = (didLog) => {
    if (didLog) setLogged(true);
    const exitAfter = prompt?.exitAfter;
    setPrompt(null);
    if (exitAfter) navigate('/guide');
  };

  return (
    <main className={`page guide-page sev-${guide.severity_color}`}>
      <header className="guide-header">
        <button type="button" className="btn-ghost" onClick={goBack}>‹ Back</button>
        <div className="guide-header-title">
          <span className="guide-header-eyebrow">GUIDE</span>
          <span className="guide-header-name">{guide.title}</span>
        </div>
        <button type="button" className="btn-ghost" onClick={exitGuide}>Exit</button>
      </header>

      <div className="guide-progress" aria-hidden="true">
        {Array.from({ length: Math.min(totalEstimate, 8) }).map((_, i) => (
          <span key={i} className={`progress-dot${i < stepCount ? ' progress-dot--filled' : ''}`} />
        ))}
      </div>
      <p className="guide-step-count">STEP {stepCount}{!isTerminal ? ` OF ${Math.max(totalEstimate, stepCount + 1)}` : ''}</p>

      <section className="step" key={step.id}>
        {step.critical && <span className="critical-badge">Critical</span>}
        {isTerminal ? (
          <p className="guidance-complete">GUIDANCE COMPLETE</p>
        ) : null}
        <p className="step-prompt">{step.prompt}</p>
        {step.note && <p className="step-note">{step.note}</p>}
      </section>

      <footer className="step-actions">
        {step.type === 'decision' &&
          step.options.map((opt) => (
            <button key={opt.label} type="button" className="btn-option" onClick={() => goTo(opt.next)}>
              {opt.label}
            </button>
          ))}

        {step.type === 'instruction' && (
          <button type="button" className="btn-primary" onClick={() => goTo(step.next)}>
            Done, next step
          </button>
        )}

        {isTerminal && (
          <TerminalActions
            step={step}
            logged={logged}
            onLog={() => setPrompt({ resolved: true, exitAfter: false })}
            onRestart={restart}
          />
        )}
      </footer>

      {prompt && <LogPrompt guide={guide} resolved={prompt.resolved} onClose={closePrompt} />}
    </main>
  );
}

function TerminalActions({ step, logged, onLog, onRestart }) {
  const nextGuide = step.next_guide ? guideById[step.next_guide] : null;
  return (
    <>
      <div className="cta-banner" role="status">{step.cta}</div>

      {step.call_emergency && (
        <a className="btn-primary btn-danger btn-link" href={`tel:${EMERGENCY_NUMBER}`}>
          Call {EMERGENCY_NUMBER} now
        </a>
      )}

      {nextGuide && (
        <Link className="btn-option btn-link" to={`/guide/${nextGuide.id}`}>
          Open {nextGuide.title} guide
        </Link>
      )}

      <button
        type="button"
        className={step.call_emergency ? 'btn-option' : 'btn-primary'}
        onClick={onLog}
        disabled={logged}
      >
        {logged ? 'Incident logged \u2713' : 'Log this incident'}
      </button>

      <div className="row">
        <button type="button" className="btn-ghost" onClick={onRestart}>Start over</button>
        <Link to="/guide" className="btn-ghost btn-link">Guides</Link>
      </div>
    </>
  );
}
