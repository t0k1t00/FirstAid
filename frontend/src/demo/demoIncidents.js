// Deterministic, clearly-labelled demo dataset for a reliable 3-minute demo.
// Centered near Kollam, Kerala (India) so the map/cluster view has a
// realistic, local-looking layout. Never sent to the backend — loaded
// straight into this device's IndexedDB via the dashboard's "Load demo
// data" control, which only appears when no API is configured.
const base = Date.parse('2026-09-19T10:20:00.000Z');
const minutes = (n) => base + n * 60 * 1000;

export const DEMO_INCIDENTS = [
  // A cluster: 3 incidents, same neighbourhood, within ~20 minutes.
  {
    id: 'demo-0001', injury_type: 'severe-bleeding', categoryIds: ['severe-bleeding'], severity: 'life-threatening',
    lat: 8.9310, lng: 76.6141, timestamp: new Date(minutes(0)).toISOString(), resolved: false,
    source: 'guide', description: '[DEMO] Worker reported heavy bleeding from arm laceration at construction site.',
  },
  {
    id: 'demo-0002', injury_type: 'unconsciousness-cpr', categoryIds: ['unconsciousness-cpr'], severity: 'life-threatening',
    lat: 8.9325, lng: 76.6158, timestamp: new Date(minutes(7)).toISOString(), resolved: false,
    source: 'guide', description: '[DEMO] Bystander found adult male unresponsive and not breathing near market entrance.',
  },
  {
    id: 'demo-0003', injury_type: 'thermal-burn', categoryIds: ['thermal-burn'], severity: 'urgent',
    lat: 8.9298, lng: 76.6122, timestamp: new Date(minutes(14)).toISOString(), resolved: false,
    source: 'ai-guidance', description: '[DEMO] Kitchen fire — person has burns on hands and forearms.',
  },
  // Scattered, unrelated incidents elsewhere in the district.
  {
    id: 'demo-0004', injury_type: 'fracture', categoryIds: ['fracture'], severity: 'urgent',
    lat: 8.8932, lng: 76.5852, timestamp: new Date(minutes(-40)).toISOString(), resolved: true,
    source: 'guide', description: '[DEMO] Cyclist fell and reports pain in wrist, possible fracture.',
  },
  {
    id: 'demo-0005', injury_type: 'choking', categoryIds: ['choking'], severity: 'life-threatening',
    lat: 9.0021, lng: 76.5290, timestamp: new Date(minutes(-90)).toISOString(), resolved: true,
    source: 'guide', description: '[DEMO] Child choked on food; incident resolved at scene by bystander.',
  },
  {
    id: 'demo-0006', injury_type: 'chemical-burn', categoryIds: ['chemical-burn', 'chemical-exposure'], severity: 'urgent',
    lat: 8.8459, lng: 76.6742, timestamp: new Date(minutes(-15)).toISOString(), resolved: false,
    source: 'ai-guidance', description: '[DEMO] Chemical spill at small workshop — two workers with skin irritation and burns.',
  },
  {
    id: 'demo-0007', injury_type: 'stroke-suspected', categoryIds: ['stroke-suspected'], severity: 'life-threatening',
    lat: 8.9821, lng: 76.5990, timestamp: new Date(minutes(-5)).toISOString(), resolved: false,
    source: 'ai-guidance', description: '[DEMO] Elderly woman reported sudden face drooping and slurred speech at community centre.',
  },
  {
    id: 'demo-0008', injury_type: 'heat-stroke', categoryIds: ['heat-stroke'], severity: 'life-threatening',
    lat: 8.8120, lng: 76.7231, timestamp: new Date(minutes(-60)).toISOString(), resolved: false,
    source: 'ai-guidance', description: '[DEMO] Construction worker collapsed; skin hot and dry, very confused.',
  },
  {
    id: 'demo-0009', injury_type: 'snake-bite', categoryIds: ['snake-bite'], severity: 'life-threatening',
    lat: 8.7541, lng: 76.6820, timestamp: new Date(minutes(-120)).toISOString(), resolved: true,
    source: 'guide', description: '[DEMO] Farm worker bitten by snake on ankle while working in field. Transferred to hospital.',
  },
  {
    id: 'demo-0010', injury_type: 'anaphylaxis', categoryIds: ['anaphylaxis', 'allergic-reaction'], severity: 'life-threatening',
    lat: 9.0105, lng: 76.6380, timestamp: new Date(minutes(-30)).toISOString(), resolved: false,
    source: 'ai-guidance', description: '[DEMO] Severe allergic reaction at restaurant — throat swelling, used EpiPen, awaiting ambulance.',
  },
];
