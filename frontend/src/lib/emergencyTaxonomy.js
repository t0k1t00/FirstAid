/**
 * Emergency taxonomy — single source of truth for all 52 recognized
 * emergency categories. Each entry defines:
 *
 *   id                     – machine identifier used across backend/frontend/DB
 *   name                   – human label
 *   group                  – UI grouping key
 *   urgency                – "critical" | "high" | "moderate" | "low"
 *   requiresEmergencyServices – whether to prompt the user to call 112/911
 *   guideId                – id of a bundled verified guide, or null
 *   keywords               – used by the local deterministic classifier
 *
 * guideId === id means the category has a dedicated step-by-step guide.
 * guideId !== null && !== id means it reuses an existing guide.
 * guideId === null means the category provides safe escalation only.
 *
 * Do NOT add entries for speculative or unverified scenarios. Every
 * keyword is matched against lower-cased free text, so keep them specific
 * enough to avoid false positives.
 */

export const GROUPS = {
  'trauma-injury':      'Trauma & Injury',
  'burns-environmental':'Burns & Environmental',
  'breathing-airway':   'Breathing & Airway',
  'cardiac-neuro':      'Cardiac & Neurological',
  'poisoning-exposure': 'Poisoning & Exposure',
  'acute-medical':      'Acute Medical',
};

export const TAXONOMY = [
  // ── Trauma & Injury ────────────────────────────────────────────────────────
  {
    id: 'severe-bleeding',
    name: 'Severe Bleeding',
    group: 'trauma-injury',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'severe-bleeding',
    keywords: ['bleeding heavily', 'heavy bleeding', 'spurting blood', 'blood won\'t stop', 'losing a lot of blood', 'hemorrhage', 'gushing blood'],
  },
  {
    id: 'minor-cuts',
    name: 'Minor Cuts & Wounds',
    group: 'trauma-injury',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'minor-cuts',
    keywords: ['small cut', 'minor cut', 'scrape', 'graze', 'superficial wound', 'light bleeding', 'nicked'],
  },
  {
    id: 'deep-wound',
    name: 'Deep or Gaping Wound',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'severe-bleeding',
    keywords: ['deep cut', 'deep wound', 'gaping wound', 'wound won\'t close', 'laceration', 'slash'],
  },
  {
    id: 'puncture-wound',
    name: 'Puncture Wound',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'minor-cuts',
    keywords: ['puncture', 'stabbed', 'impaled', 'pierced', 'nail wound', 'spike'],
  },
  {
    id: 'amputation',
    name: 'Amputation / Partial Amputation',
    group: 'trauma-injury',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'severe-bleeding',
    keywords: ['amputated', 'amputation', 'severed finger', 'severed hand', 'severed arm', 'severed leg', 'finger cut off', 'hand cut off', 'limb cut off'],
  },
  {
    id: 'crush-injury',
    name: 'Crush Injury',
    group: 'trauma-injury',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['crushed', 'crush injury', 'trapped under', 'pinned under', 'heavy object fell', 'compression injury'],
  },
  {
    id: 'fracture',
    name: 'Fracture (Broken Bone)',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'fracture-sprain',
    keywords: ['broke', 'broken', 'fracture', 'bone sticking out', 'snapped', 'compound fracture'],
  },
  {
    id: 'sprain-strain',
    name: 'Sprain or Strain',
    group: 'trauma-injury',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'fracture-sprain',
    keywords: ['sprain', 'sprained', 'strain', 'strained', 'twisted ankle', 'twisted knee', 'pulled muscle'],
  },
  {
    id: 'dislocation',
    name: 'Dislocation',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: null,
    keywords: ['dislocated', 'dislocation', 'joint out of place', 'shoulder popped out', 'knee cap out'],
  },
  {
    id: 'head-injury',
    name: 'Head Injury',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'head-injury',
    keywords: ['hit their head', 'head injury', 'head wound', 'head trauma', 'hit on the head', 'concussion', 'knocked out', 'bump on the head', 'skull'],
  },
  {
    id: 'neck-spinal-injury',
    name: 'Neck or Spinal Injury',
    group: 'trauma-injury',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['neck injury', 'spine injury', 'spinal injury', 'can\'t feel legs', 'can\'t move legs', 'neck pain after accident', 'whiplash'],
  },
  {
    id: 'eye-injury',
    name: 'Eye Injury',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'eye-injury',
    keywords: ['eye injury', 'hit in the eye', 'eye trauma', 'cut near eye', 'something in eye'],
  },
  {
    id: 'foreign-object-eye',
    name: 'Foreign Object in Eye',
    group: 'trauma-injury',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'eye-injury',
    keywords: ['something in eye', 'stuck in eye', 'stuck in their eye', 'eye irritation', 'foreign object eye', 'particle in eye', 'debris in eye', 'dust in eye', 'sand in eye', 'something stuck in their eye'],
  },
  {
    id: 'nosebleed',
    name: 'Nosebleed',
    group: 'trauma-injury',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'nosebleed',
    keywords: ['nosebleed', 'nose bleed', 'nose is bleeding', 'bleeding from nose', 'bloody nose'],
  },
  {
    id: 'dental-injury',
    name: 'Dental Injury / Knocked-Out Tooth',
    group: 'trauma-injury',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: null,
    keywords: ['tooth knocked out', 'knocked out tooth', 'dental injury', 'broken tooth', 'dental trauma', 'tooth fell out'],
  },
  {
    id: 'animal-bite',
    name: 'Animal Bite',
    group: 'trauma-injury',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'animal-bite',
    keywords: ['animal bite', 'dog bite', 'cat bite', 'bitten by', 'bitten by dog', 'bitten by cat', 'bitten by animal', 'dog attacked'],
  },
  {
    id: 'snake-bite',
    name: 'Snake Bite',
    group: 'trauma-injury',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'snake-bite',
    keywords: ['snake bite', 'snakebite', 'bitten by a snake', 'bitten by snake', 'snake attack', 'snake venom', 'venomous snake'],
  },
  {
    id: 'insect-bite-sting',
    name: 'Insect Bite or Sting',
    group: 'trauma-injury',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'insect-bite-sting',
    keywords: ['bee sting', 'wasp sting', 'insect bite', 'ant bite', 'hornet sting', 'stung by', 'bitten by insect', 'scorpion sting'],
  },

  // ── Burns & Environmental ──────────────────────────────────────────────────
  {
    id: 'thermal-burn',
    name: 'Thermal Burn (Heat)',
    group: 'burns-environmental',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'burns',
    keywords: ['burn', 'burned', 'burnt', 'scald', 'scalded', 'hot water burn', 'steam burn', 'fire burn', 'hot oil burn', 'cooking burn'],
  },
  {
    id: 'chemical-burn',
    name: 'Chemical Burn',
    group: 'burns-environmental',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'burns',
    keywords: ['chemical burn', 'acid burn', 'alkali burn', 'corrosive burn', 'cleaning product burn', 'chemical on skin'],
  },
  {
    id: 'electrical-burn',
    name: 'Electrical Injury',
    group: 'burns-environmental',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'electrical-injury',
    keywords: ['electric shock', 'electrical shock', 'electrocuted', 'electrocution', 'lightning strike', 'shocked by electricity', 'power line'],
  },
  {
    id: 'sunburn',
    name: 'Severe Sunburn',
    group: 'burns-environmental',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: null,
    keywords: ['sunburn', 'sun burn', 'burned by sun', 'severe sunburn', 'sun blisters'],
  },
  {
    id: 'heat-exhaustion',
    name: 'Heat Exhaustion',
    group: 'burns-environmental',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'heat-illness',
    keywords: ['heat exhaustion', 'overheating', 'too hot', 'dizzy in heat', 'nauseous in heat', 'sweating heavily in heat', 'faint from heat', 'heat cramps'],
  },
  {
    id: 'heat-stroke',
    name: 'Heat Stroke',
    group: 'burns-environmental',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'heat-illness',
    keywords: ['heat stroke', 'heatstroke', 'not sweating but very hot', 'confused from heat', 'collapsed from heat', 'stopped sweating', 'heat stroke symptoms'],
  },
  {
    id: 'hypothermia',
    name: 'Hypothermia',
    group: 'burns-environmental',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'hypothermia',
    keywords: ['hypothermia', 'too cold', 'shivering violently', 'cold exposure', 'freezing', 'exposure to cold', 'wet and cold'],
  },
  {
    id: 'frostbite',
    name: 'Frostbite',
    group: 'burns-environmental',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'hypothermia',
    keywords: ['frostbite', 'frost bite', 'frozen skin', 'frozen fingers', 'frozen toes', 'black from cold', 'numb from cold'],
  },

  // ── Breathing & Airway ─────────────────────────────────────────────────────
  {
    id: 'choking',
    name: 'Choking',
    group: 'breathing-airway',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'choking',
    keywords: ['choking', 'choke', 'something stuck in throat', 'can\'t breathe', 'cant breathe', 'airway blocked', 'food stuck', 'swallowed something', 'gagging'],
  },
  {
    id: 'breathing-difficulty',
    name: 'Difficulty Breathing',
    group: 'breathing-airway',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['difficulty breathing', 'trouble breathing', 'struggling to breathe', 'short of breath', 'breathless', 'laboured breathing', 'gasping'],
  },
  {
    id: 'asthma-emergency',
    name: 'Asthma Emergency',
    group: 'breathing-airway',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'asthma-emergency',
    keywords: ['asthma attack', 'asthma emergency', 'inhaler not working', 'asthma', 'wheezing', 'can\'t use inhaler'],
  },
  {
    id: 'allergic-reaction',
    name: 'Allergic Reaction',
    group: 'breathing-airway',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'allergic-reaction',
    keywords: ['allergic reaction', 'allergy attack', 'hives', 'rash from allergy', 'swelling from allergy', 'itching all over'],
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis (Severe Allergic Reaction)',
    group: 'breathing-airway',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'allergic-reaction',
    keywords: ['anaphylaxis', 'anaphylactic shock', 'throat swelling', 'tongue swelling', 'epipen', 'severe allergy', 'severe allergic reaction', 'face swelling with breathing difficulty'],
  },
  {
    id: 'smoke-inhalation',
    name: 'Smoke Inhalation',
    group: 'breathing-airway',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'smoke-inhalation',
    keywords: ['smoke inhalation', 'inhaled smoke', 'breathing after fire', 'coughing from smoke', 'trapped in fire', 'house fire breathing'],
  },
  {
    id: 'drowning',
    name: 'Drowning / Near-Drowning',
    group: 'breathing-airway',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'drowning',
    keywords: ['drowning', 'drowned', 'near drowning', 'underwater', 'pulled from water', 'pulled from swimming pool', 'not breathing after water', 'swimming accident', 'swimming pool', 'rescued from water'],
  },

  // ── Cardiac & Neurological ─────────────────────────────────────────────────
  {
    id: 'unconsciousness-cpr',
    name: 'Unconsciousness / Cardiac Arrest',
    group: 'cardiac-neuro',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'unconsciousness-cpr',
    keywords: ['unconscious', 'unresponsive', 'not waking', 'passed out', 'not breathing', 'no pulse', 'cardiac arrest', 'cpr', 'heart stopped'],
  },
  {
    id: 'chest-pain',
    name: 'Chest Pain',
    group: 'cardiac-neuro',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'chest-pain',
    keywords: ['chest pain', 'chest tightness', 'heart attack', 'pain in chest', 'pressure in chest', 'crushing chest', 'squeezing in chest'],
  },
  {
    id: 'stroke-suspected',
    name: 'Suspected Stroke',
    group: 'cardiac-neuro',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'stroke',
    keywords: ['stroke', 'face drooping', 'arm weak', 'slurred speech', 'can\'t speak', 'sudden confusion', 'suddenly can\'t talk', 'sudden vision loss', 'sudden severe headache', 'face droop', 'facial droop'],
  },
  {
    id: 'seizure',
    name: 'Seizure',
    group: 'cardiac-neuro',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'seizure',
    keywords: ['seizure', 'fit', 'convulsion', 'shaking uncontrollably', 'epileptic fit', 'epilepsy', 'having a fit', 'convulsing'],
  },
  {
    id: 'fainting',
    name: 'Fainting / Collapse',
    group: 'cardiac-neuro',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'fainting',
    keywords: ['fainted', 'fainting', 'faint', 'collapsed suddenly', 'lost consciousness briefly', 'blacked out', 'syncope', 'went limp'],
  },
  {
    id: 'shock',
    name: 'Shock',
    group: 'cardiac-neuro',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'severe-bleeding',
    keywords: ['shock', 'pale and cold skin', 'clammy skin', 'rapid weak pulse', 'confused after injury'],
  },
  {
    id: 'severe-weakness',
    name: 'Sudden Severe Weakness',
    group: 'cardiac-neuro',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['sudden weakness', 'sudden numbness', 'can\'t move arm', 'can\'t move leg', 'one side weakness', 'arm went numb suddenly'],
  },

  // ── Poisoning & Exposure ───────────────────────────────────────────────────
  {
    id: 'poisoning',
    name: 'Poisoning',
    group: 'poisoning-exposure',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'poisoning',
    keywords: ['poisoning', 'poisoned', 'swallowed poison', 'ingested something toxic', 'ate something dangerous', 'swallowed something toxic', 'ingested poison', 'toxic ingestion'],
  },
  {
    id: 'drug-overdose',
    name: 'Drug Overdose',
    group: 'poisoning-exposure',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: 'poisoning',
    keywords: ['overdose', 'drug overdose', 'took too many pills', 'too much medication', 'took too much'],
  },
  {
    id: 'chemical-exposure',
    name: 'Chemical Exposure',
    group: 'poisoning-exposure',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'chemical-exposure',
    keywords: ['chemical exposure', 'chemical spill', 'chemical on skin', 'chemical in eye', 'exposed to chemical', 'acid spill', 'caustic spill'],
  },
  {
    id: 'carbon-monoxide',
    name: 'Carbon Monoxide Exposure',
    group: 'poisoning-exposure',
    urgency: 'critical',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['carbon monoxide', 'co poisoning', 'co alarm', 'gas leak', 'fumes', 'headache from fumes', 'everyone feels ill at home'],
  },
  {
    id: 'unknown-ingestion',
    name: 'Unknown Substance Ingestion',
    group: 'poisoning-exposure',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: 'poisoning',
    keywords: ['swallowed unknown', 'ate unknown', 'child ate something', 'drank unknown', 'unknown substance ingested', 'swallowed cleaning product'],
  },

  // ── Acute Medical ──────────────────────────────────────────────────────────
  {
    id: 'diabetic-emergency',
    name: 'Diabetic Emergency',
    group: 'acute-medical',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: 'diabetic-emergency',
    keywords: ['diabetic emergency', 'low blood sugar', 'hypoglycemia', 'hyperglycemia', 'blood sugar', 'insulin problem', 'diabetic shock', 'glucose emergency'],
  },
  {
    id: 'severe-dehydration',
    name: 'Severe Dehydration',
    group: 'acute-medical',
    urgency: 'high',
    requiresEmergencyServices: false,
    guideId: null,
    keywords: ['severe dehydration', 'dehydrated', 'not urinating', 'no urine', 'sunken eyes', 'very dry mouth', 'extreme thirst and weakness'],
  },
  {
    id: 'severe-abdominal-pain',
    name: 'Severe Abdominal Pain',
    group: 'acute-medical',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['severe stomach pain', 'severe abdominal pain', 'acute abdomen', 'appendicitis', 'unbearable stomach pain', 'rigid abdomen'],
  },
  {
    id: 'high-fever',
    name: 'High Fever',
    group: 'acute-medical',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: null,
    keywords: ['high fever', 'very high temperature', 'fever over 40', 'fever with rash', 'child with high fever', 'burning up'],
  },
  {
    id: 'severe-headache',
    name: 'Sudden Severe Headache',
    group: 'acute-medical',
    urgency: 'high',
    requiresEmergencyServices: true,
    guideId: null,
    keywords: ['worst headache', 'sudden severe headache', 'thunderclap headache', 'headache with stiff neck', 'worst headache of life'],
  },
  {
    id: 'panic-hyperventilation',
    name: 'Panic Attack / Hyperventilation',
    group: 'acute-medical',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: 'panic-hyperventilation',
    keywords: ['panic attack', 'hyperventilation', 'hyperventilating', 'breathing too fast', 'anxiety attack', 'tingling from breathing', 'dizzy from breathing too fast'],
  },
  {
    id: 'general',
    name: 'General Emergency',
    group: 'acute-medical',
    urgency: 'moderate',
    requiresEmergencyServices: false,
    guideId: null,
    keywords: [],
  },
];

/** Map by id for O(1) lookup */
export const TAXONOMY_BY_ID = Object.fromEntries(TAXONOMY.map((t) => [t.id, t]));

/** All valid category IDs — used by backend allowlist and frontend validation */
export const ALL_CATEGORY_IDS = new Set(TAXONOMY.map((t) => t.id));

/** Urgency → priority for the incident coordinator */
export const URGENCY_TO_SEVERITY = {
  critical: 'life-threatening',
  high: 'urgent',
  moderate: 'moderate',
  low: 'moderate',
};

/**
 * Given a list of matched category IDs, return the overall worst-case
 * urgency. Determined purely from the taxonomy — never from AI output.
 */
export function resolveOverallUrgency(categoryIds) {
  const order = ['critical', 'high', 'moderate', 'low'];
  let best = 'low';
  for (const id of categoryIds) {
    const cat = TAXONOMY_BY_ID[id];
    if (!cat) continue;
    if (order.indexOf(cat.urgency) < order.indexOf(best)) {
      best = cat.urgency;
    }
  }
  return best;
}

/**
 * Deterministic local classifier. Tries keyword matching against the
 * taxonomy. Returns all matching categories sorted by urgency, never
 * inventing a category not in the allowlist.
 *
 * Falls back to ['general'] if nothing matches.
 */
export function classifyLocal(text) {
  const t = (text || '').toLowerCase();

  // Check for life-threatening signals regardless of category match
  const CRITICAL_SIGNALS = [
    'not breathing', 'cardiac arrest', 'no pulse', 'unconscious', 'unresponsive',
    'severe bleeding', 'anaphylaxis', 'throat swelling', 'drowning', 'drowned',
    'electrocuted', 'snake bite', 'overdose', 'stroke', 'face drooping',
    'chest pain', 'heart attack', 'seizure and not waking', 'crush',
  ];
  const urgentOverride = CRITICAL_SIGNALS.some((sig) => t.includes(sig));

  const matched = [];
  for (const cat of TAXONOMY) {
    if (cat.id === 'general') continue; // reserved as explicit fallback
    if (cat.keywords.some((kw) => t.includes(kw))) {
      matched.push(cat);
    }
  }

  if (matched.length === 0) {
    return {
      categoryIds: ['general'],
      urgentOverride,
      confident: false,
      source: 'local',
    };
  }

  // Sort matched by urgency (most severe first), deduplicate
  const urgencyOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  const sorted = matched.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  const deduped = [...new Set(sorted.map((c) => c.id))];

  return {
    categoryIds: deduped,
    urgentOverride: urgentOverride || sorted[0]?.urgency === 'critical',
    confident: true,
    source: 'local',
  };
}
