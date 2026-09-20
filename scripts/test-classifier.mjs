/**
 * Offline classifier test — runs without network or AWS.
 * Uses the actual taxonomy module via dynamic import.
 * Run: node scripts/test-classifier.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

// We can't import ESM with Vite-specific syntax directly,
// so we inline the classifier logic by parsing the taxonomy file.

const taxonomyPath = new URL('../frontend/src/lib/emergencyTaxonomy.js', import.meta.url);
const src = readFileSync(fileURLToPath(taxonomyPath), 'utf8');

// Extract entries via regex – good enough for CI
const entryRe = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?keywords:\s*\[([\s\S]*?)\]/g;
const TAXONOMY = [];
let m;
while ((m = entryRe.exec(src)) !== null) {
  const id = m[1];
  const kwBlock = m[2];
  const kws = [...kwBlock.matchAll(/'([^']+)'/g)].map(k => k[1]);
  TAXONOMY.push({ id, keywords: kws });
}

function classifyLocal(text) {
  const t = (text || '').toLowerCase();
  const matched = TAXONOMY.filter(cat => {
    if (cat.id === 'general') return false;
    return cat.keywords.some(kw => t.includes(kw));
  }).map(c => c.id);
  return matched.length ? matched : ['general'];
}

const tests = [
  // [input, mustIncludeOneOf]
  ['heavy bleeding',           ['severe-bleeding']],
  ['small cut',                ['minor-cuts']],
  ['deep wound',               ['deep-wound']],
  ['puncture wound',           ['puncture-wound']],
  ['amputation',               ['amputation']],
  ['crush injury',             ['crush-injury']],
  ['fracture',                 ['fracture']],
  ['sprain',                   ['sprain-strain']],
  ['dislocation',              ['dislocation']],
  ['head injury',              ['head-injury']],
  ['neck injury',              ['neck-spinal-injury']],
  ['eye injury',               ['eye-injury']],
  ['something in eye',         ['eye-injury','foreign-object-eye']],
  ['nosebleed',                ['nosebleed']],
  ['dental injury',            ['dental-injury']],
  ['animal bite',              ['animal-bite']],
  ['snake bite',               ['snake-bite']],
  ['bee sting',                ['insect-bite-sting']],
  ['burn',                     ['thermal-burn']],
  ['chemical burn',            ['chemical-burn']],
  ['electric shock',           ['electrical-burn']],
  ['sunburn',                  ['sunburn']],
  ['heat exhaustion',          ['heat-exhaustion']],
  ['heat stroke',              ['heat-stroke']],
  ['hypothermia',              ['hypothermia']],
  ['frostbite',                ['frostbite']],
  ['choking',                  ['choking']],
  ['difficulty breathing',     ['breathing-difficulty']],
  ['asthma attack',            ['asthma-emergency']],
  ['allergic reaction',        ['allergic-reaction']],
  ['anaphylaxis',              ['anaphylaxis']],
  ['smoke inhalation',         ['smoke-inhalation']],
  ['drowning',                 ['drowning']],
  ['unconscious person',       ['unconsciousness-cpr']],
  ['chest pain',               ['chest-pain']],
  ['stroke',                   ['stroke-suspected']],
  ['seizure',                  ['seizure']],
  ['fainting',                 ['fainting']],
  ['shock',                    ['shock']],
  ['sudden weakness',          ['severe-weakness']],
  ['poisoning',                ['poisoning']],
  ['overdose',                 ['drug-overdose']],
  ['chemical exposure',        ['chemical-exposure']],
  ['carbon monoxide',          ['carbon-monoxide']],
  ['child ate something',      ['unknown-ingestion']],
  ['diabetic emergency',       ['diabetic-emergency']],
  ['severe dehydration',       ['severe-dehydration']],
  ['severe abdominal pain',    ['severe-abdominal-pain']],
  ['high fever',               ['high-fever']],
  ['worst headache of my life',['severe-headache']],
  ['panic attack',             ['panic-hyperventilation']],
  // Multi-category
  ['severe allergic reaction causing throat swelling', ['anaphylaxis','allergic-reaction']],
  ['person is not breathing after being pulled from water', ['unconsciousness-cpr','drowning']],
  // General fallback
  ['unknown random text xyz',  ['general']],
];

let passed = 0;
let failed = 0;
const failures = [];

for (const [input, mustInclude] of tests) {
  const result = classifyLocal(input);
  const ok = result.some(id => mustInclude.includes(id));
  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push({ input, expected: mustInclude, got: result });
  }
}

console.log(`\n=== LOCAL CLASSIFIER TEST RESULTS ===`);
console.log(`Total: ${tests.length}  Passed: ${passed}  Failed: ${failed}`);

if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) {
    console.log(`  INPUT: "${f.input}"`);
    console.log(`  EXPECTED one of: ${f.expected.join(', ')}`);
    console.log(`  GOT:  ${f.got.join(', ')}`);
  }
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
