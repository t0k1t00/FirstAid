// Medical guidance sources, one per guide. Content in the guide JSON files is
// paraphrased from these publicly published first-aid references — never
// invented. Shown in the app under "Medical guidance sources" and on the
// dashboard, so anyone can check what a step is based on.
export const GUIDE_SOURCES = {
  'severe-bleeding': 'Red Cross First Aid: Severe Bleeding; St John Ambulance: Bleeding (Severe)',
  choking: 'Red Cross First Aid: Choking (Adult/Child); St John Ambulance: Choking',
  burns: 'Red Cross First Aid: Burns; St John Ambulance: Burns and Scalds',
  'fracture-sprain': 'St John Ambulance: Broken Bones (Fractures); Red Cross First Aid: Sprains and Strains',
  'unconsciousness-cpr': 'Red Cross First Aid: Unresponsive and Breathing / CPR; St John Ambulance: Unconscious and Breathing',
};

export const MEDICAL_DISCLAIMER =
  'FirstAidFlow provides general first-aid guidance paraphrased from Red Cross and St John Ambulance style sources. It is not a diagnosis, not medical advice, and not a substitute for professional emergency services or medical training.';
