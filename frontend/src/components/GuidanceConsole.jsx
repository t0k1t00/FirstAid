import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { guideById, getFirstPass } from '../guides';
import { classifyEmergency, severityFromCategories, requiresEmergencyServices } from '../lib/emergencyClassifier';
import { TAXONOMY_BY_ID } from '../lib/emergencyTaxonomy';
import { createIncidentFromGuidance } from '../incidents/logIncident';
import { EMERGENCY_NUMBER, EMERGENCY_LABEL } from '../config';
import Icon from '../icons/Icon';

const EXAMPLES = [
  'Someone is bleeding heavily from their leg',
  'A person is unconscious and not breathing',
  'My friend suddenly cannot move one side of their face',
  'Someone is having an asthma attack',
  'A child swallowed something',
  'There was a house fire and someone inhaled smoke',
];

const WHY_BY_SEVERITY = {
  'life-threatening': 'This can become life-threatening within minutes. Getting emergency help started matters more than getting every step perfect.',
  urgent: 'This needs prompt first aid and, usually, medical follow-up soon after.',
  moderate: 'This is usually manageable with first aid, but watch for signs it is getting worse.',
};

const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function GuidanceConsole() {
  const [text, setText] = useState('');
  const [stage, setStage] = useState('idle'); // idle | analyzing | clarifying | result
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [position, setPosition] = useState(null);
  const [locationState, setLocationState] = useState('idle');
  const [incidentState, setIncidentState] = useState('idle');
  const [landmark, setLandmark] = useState('');
  const recognitionRef = useRef(null);

  const submit = (value) => {
    const input = (value ?? text).trim();
    if (!input) return;
    setStage('analyzing');
    setIncidentState('idle');
    setTimeout(() => {
      classifyEmergency(input).then((classification) => {
        const res = { input, ...classification };
        if (classification.clarifyingQuestion && classification.categoryIds.every(id => id === 'general')) {
          setResult(res);
          setStage('clarifying');
        } else {
          setResult(res);
          setStage('result');
        }
      });
    }, 300);
  };

  const answerClarification = (answer) => {
    // Append the clarification answer to the text and re-classify
    const combined = `${result.input} — ${answer}`;
    setText(combined);
    setStage('analyzing');
    classifyEmergency(combined).then((classification) => {
      setResult({ input: combined, ...classification });
      setStage('result');
    });
  };

  const skipClarification = () => {
    // Proceed with current (conservative) result
    setStage('result');
  };

  const startMic = () => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => setText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const shareLocation = () => {
    if (!('geolocation' in navigator)) { setLocationState('denied'); return; }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null, timestamp: new Date().toISOString() });
        setLocationState('granted');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const createIncident = async () => {
    if (!result) return;
    setIncidentState('saving');
    const primaryId = result.categoryIds?.[0] ?? 'general';
    const severity = severityFromCategories(result.categoryIds ?? ['general']);
    await createIncidentFromGuidance({
      category: primaryId,
      categoryIds: result.categoryIds ?? ['general'],
      severity,
      description: result.input,
      position: locationState === 'granted' ? position : null,
      locationNote: landmark.trim() || null,
    });
    setIncidentState('saved');
  };

  const reset = () => {
    setText(''); setResult(null); setStage('idle');
    setIncidentState('idle'); setLandmark('');
    setPosition(null); setLocationState('idle');
  };

  return (
    <section className="console" aria-label="Emergency Guidance Assistant">
      <div className="console-head">
        <p className="eyebrow">EMERGENCY GUIDANCE</p>
        <h2>Describe what is happening</h2>
        <p className="console-sub">
          We will identify likely next steps from verified first-aid guidance.
          First-aid guidance only — not a substitute for emergency medical care.
        </p>
      </div>

      {stage !== 'result' && stage !== 'clarifying' && (
        <ConsoleInput
          text={text} setText={setText}
          onSubmit={() => submit()}
          analyzing={stage === 'analyzing'}
          listening={listening}
          canListen={Boolean(SpeechRecognition)}
          onMic={startMic}
        />
      )}

      {stage === 'idle' && (
        <div className="console-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => { setText(ex); submit(ex); }}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {stage === 'clarifying' && result?.clarifyingQuestion && (
        <ClarificationCard
          question={result.clarifyingQuestion}
          onAnswer={answerClarification}
          onSkip={skipClarification}
        />
      )}

      {stage === 'result' && result && (
        <ConsoleResult
          result={result}
          locationState={locationState}
          incidentState={incidentState}
          onShareLocation={shareLocation}
          onCreateIncident={() => setIncidentState('confirming')}
          onConfirmIncident={createIncident}
          onCancelConfirm={() => setIncidentState('idle')}
          onReset={reset}
          onResetLocation={() => { setPosition(null); setLocationState('idle'); }}
          landmark={landmark}
          setLandmark={setLandmark}
        />
      )}

      <div className="console-quick-actions">
        <a className="btn-ghost console-call" href={`tel:${EMERGENCY_NUMBER}`}>
          <Icon name="phone" size={16} />
          Call {EMERGENCY_NUMBER} ({EMERGENCY_LABEL})
        </a>
      </div>
    </section>
  );
}

function ClarificationCard({ question, onAnswer, onSkip }) {
  return (
    <div className="console-clarification">
      <ConsoleCard title="CLARIFYING QUESTION">
        <p className="console-question">{question}</p>
        <div className="console-answer-row">
          <button type="button" className="btn-option" onClick={() => onAnswer('Yes')}>Yes</button>
          <button type="button" className="btn-option" onClick={() => onAnswer('No')}>No</button>
          <button type="button" className="btn-ghost btn-tiny" onClick={onSkip}>Skip — proceed conservatively</button>
        </div>
      </ConsoleCard>
    </div>
  );
}

function ConsoleInput({ text, setText, onSubmit, analyzing, listening, canListen, onMic }) {
  return (
    <form className="console-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <textarea
        className="console-textarea"
        placeholder="e.g. Someone fell off a ladder and their arm looks bent"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        disabled={analyzing}
        aria-label="Describe the emergency"
      />
      <div className="console-form-row">
        {canListen && (
          <button
            type="button"
            className={`btn-ghost console-mic${listening ? ' console-mic--active' : ''}`}
            onClick={onMic}
            aria-label="Describe by speaking"
          >
            <Icon name="mic" size={16} />
          </button>
        )}
        <button type="submit" className="btn-primary console-send" disabled={analyzing || !text.trim()}>
          {analyzing ? (
            <span className="console-analyzing">
              <span className="console-analyzing-dot" /> ANALYZING EMERGENCY
            </span>
          ) : (
            <><Icon name="send" size={16} /> Get guidance</>
          )}
        </button>
      </div>
    </form>
  );
}

function ConsoleResult({ result, locationState, incidentState, onShareLocation, onCreateIncident, onConfirmIncident, onCancelConfirm, onReset, landmark, setLandmark, onResetLocation }) {
  const navigate = useNavigate();
  const categoryIds = result.categoryIds ?? ['general'];
  // Severity is derived exclusively from the taxonomy — never from AI-provided urgentOverride.
  // urgentOverride is only used as an additional signal to show the emergency CTA,
  // alongside the taxonomy's own requiresEmergencyServices flag.
  const severity = severityFromCategories(categoryIds);
  const needsEmergencyServices = requiresEmergencyServices(categoryIds);
  const escalate = severity === 'life-threatening';

  // Build matched categories with guide info
  const matchedCategories = categoryIds
    .map(id => ({ cat: TAXONOMY_BY_ID[id], guide: guideById[id] }))
    .filter(({ cat }) => cat);

  const primaryCategory = matchedCategories[0];
  const primaryGuide = primaryCategory?.guide ?? null;
  const firstPass = primaryGuide ? getFirstPass(primaryGuide) : null;

  const actions = firstPass?.actions.length
    ? firstPass.actions
    : [
        'Make sure the scene is safe before approaching.',
        'Do not move the person unless there is immediate danger.',
        'Check whether they are responsive and breathing normally.',
      ];

  const primaryLabel = primaryCategory?.cat?.name ?? 'General emergency';
  const severityColor = escalate ? 'red' : severity === 'urgent' ? 'orange' : 'yellow';

  return (
    <div className="console-result">
      <div className="console-result-header">
        <span className={`badge sev-badge-${severityColor}`}>{primaryLabel}</span>
        <button type="button" className="btn-ghost btn-tiny" onClick={onReset}>New description</button>
      </div>

      {result.source === 'verified-local-fallback' && (
        <p className="console-note"><Icon name="cloud" size={14} /> AI guidance is unavailable. Verified emergency guidance remains available.</p>
      )}

      {matchedCategories.length > 1 && (
        <ConsoleCard title="ALL MATCHED CATEGORIES">
          <div className="console-pathways">
            {matchedCategories.map(({ cat, guide }) => (
              guide
                ? <Link key={cat.id} to={`/guide/${guide.id}`} className="btn-option btn-link">{cat.name} — Verified guide</Link>
                : <span key={cat.id} className="console-escalation-badge">{cat.name} — Emergency services required</span>
            ))}
          </div>
        </ConsoleCard>
      )}

      {!result.confident && (
        <p className="console-note">
          <Icon name="warning" size={14} /> Description did not clearly match a specific category. Guidance below is general and conservative.
        </p>
      )}

      <Link to="/sources" className="console-source-link">View guidance sources</Link>

      <ConsoleCard title="IMMEDIATE ACTION">
        <ol className="console-actions">
          {actions.map((a, i) => <li key={i}>{a}</li>)}
        </ol>
      </ConsoleCard>

      {(needsEmergencyServices || !primaryGuide) && (
        <ConsoleCard title="ESCALATE" tone={escalate ? 'critical' : undefined}>
          <p>
            {escalate
              ? 'This may require immediate medical assistance — call emergency services now.'
              : 'If this is or becomes life-threatening, call emergency services immediately.'}
          </p>
          <a className="btn-primary btn-danger btn-link" href={`tel:${EMERGENCY_NUMBER}`}>
            <Icon name="phone" size={16} /> Call {EMERGENCY_NUMBER}
          </a>
        </ConsoleCard>
      )}

      <ConsoleCard title="WHY THIS MATTERS">
        <p>{WHY_BY_SEVERITY[severity] ?? WHY_BY_SEVERITY.moderate}</p>
      </ConsoleCard>

      {primaryGuide && firstPass?.nextStep?.type === 'decision' && (
        <ConsoleCard title="NEXT QUESTION">
          <p className="console-question">{firstPass.nextStep.prompt}</p>
          <div className="console-answer-row">
            {firstPass.nextStep.options.map((opt) => (
              <button key={opt.label} type="button" className="btn-option" onClick={() => navigate(`/guide/${primaryGuide.id}`)}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="console-note-muted">Continues into the full verified guide.</p>
        </ConsoleCard>
      )}

      {primaryGuide && (
        <Link to={`/guide/${primaryGuide.id}`} className="btn-option btn-link">
          Open full {primaryGuide.title} guide →
        </Link>
      )}

      <ConsoleCard title="COORDINATE">
        <div className="console-coordinate-row">
          <button type="button" className="btn-option" onClick={onShareLocation} disabled={locationState === 'granted'}>
            <Icon name="location" size={16} />
            {locationState === 'granted' ? 'Location shared' : locationState === 'requesting' ? 'Requesting…' : 'Share my location'}
          </button>
          {incidentState === 'confirming' ? (
            <div className="incident-confirmation">
              <div>
                <strong>Emergency incident</strong>
                <span>{primaryLabel} · {escalate ? 'Critical' : severity === 'urgent' ? 'High' : 'Moderate'}</span>
                <span>{locationState === 'granted' ? 'Location shared' : landmark.trim() ? `Landmark: ${landmark.trim()}` : 'Location not provided'}</span>
              </div>
              <div className="console-confirm-actions">
                <button type="button" className="btn-ghost" onClick={onCancelConfirm}>Cancel</button>
                <button type="button" className="btn-primary btn-danger" onClick={onConfirmIncident}>Create incident</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-primary" onClick={onCreateIncident} disabled={incidentState === 'saving' || incidentState === 'saved'}>
              {incidentState === 'saved' ? 'Incident created' : incidentState === 'saving' ? 'Saving…' : 'Create Emergency Incident'}
            </button>
          )}
        </div>
        {locationState === 'denied' && (
          <div className="location-fallback">
            <p className="console-note-muted">Location access was not provided. You can add a nearby landmark.</p>
            <input className="console-landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={160} placeholder="Nearby landmark (optional)" aria-label="Nearby landmark" />
          </div>
        )}
        {locationState === 'granted' && (
          <button type="button" className="btn-ghost btn-tiny" onClick={() => { setLandmark(''); onResetLocation?.(); }}>Remove location</button>
        )}
        {incidentState === 'saved' && (
          <p className="console-note-muted">
            Saved{navigator.onLine ? ' and syncing' : ' locally — will sync when back online'}.{' '}
            <Link to="/dashboard">View on dashboard</Link>
          </p>
        )}
      </ConsoleCard>
    </div>
  );
}

function ConsoleCard({ title, tone, children }) {
  return (
    <div className={`console-card${tone ? ` console-card--${tone}` : ''}`}>
      <div className="console-card-title">{title}</div>
      {children}
    </div>
  );
}
