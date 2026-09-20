import severeBleeding from './severe-bleeding.json';
import minorCuts from './minor-cuts.json';
import fractureSprain from './fracture-sprain.json';
import headInjury from './head-injury.json';
import eyeInjury from './eye-injury.json';
import nosebleed from './nosebleed.json';
import animalBite from './animal-bite.json';
import snakeBite from './snake-bite.json';
import insectBiteSting from './insect-bite-sting.json';
import burns from './burns.json';
import electricalInjury from './electrical-injury.json';
import heatIllness from './heat-illness.json';
import hypothermia from './hypothermia.json';
import choking from './choking.json';
import asthmaEmergency from './asthma-emergency.json';
import allergicReaction from './allergic-reaction.json';
import smokeInhalation from './smoke-inhalation.json';
import drowning from './drowning.json';
import unconsciousnessCpr from './unconsciousness-cpr.json';
import chestPain from './chest-pain.json';
import stroke from './stroke.json';
import seizure from './seizure.json';
import fainting from './fainting.json';
import poisoning from './poisoning.json';
import chemicalExposure from './chemical-exposure.json';
import diabeticEmergency from './diabetic-emergency.json';
import panicHyperventilation from './panic-hyperventilation.json';
import { validateGuide } from './validate';

export const guides = [
  severeBleeding, minorCuts, fractureSprain, headInjury, eyeInjury,
  nosebleed, animalBite, snakeBite, insectBiteSting, burns,
  electricalInjury, heatIllness, hypothermia, choking, asthmaEmergency,
  allergicReaction, smokeInhalation, drowning, unconsciousnessCpr,
  chestPain, stroke, seizure, fainting, poisoning, chemicalExposure,
  diabeticEmergency, panicHyperventilation,
];

export const guideById = Object.fromEntries(guides.map((g) => [g.id, g]));

export const SEVERITY_LABELS = {
  'life-threatening': 'Life-threatening',
  urgent: 'Urgent',
  moderate: 'Moderate',
};

export const SEVERITY_COLORS = {
  'life-threatening': 'red',
  urgent: 'orange',
  moderate: 'yellow',
};

export function getStep(guide, stepId) {
  return guide.steps.find((s) => s.id === stepId);
}

export function getFirstPass(guide, maxSteps = 4) {
  let step = getStep(guide, guide.start);
  const actions = [];
  let count = 0;
  while (step && step.type === 'instruction' && count < maxSteps) {
    actions.push(step.prompt);
    step = getStep(guide, step.next);
    count += 1;
  }
  return { actions, nextStep: step ?? null };
}

export function getInjuryLabel(injuryType) {
  return guideById[injuryType]?.title ?? 'General emergency';
}

if (import.meta.env.DEV) {
  for (const guide of guides) {
    const problems = validateGuide(guide);
    if (problems.length) {
      console.error(`[guides] ${guide.id} has broken links:\n  ${problems.join('\n  ')}`);
    }
  }
}
