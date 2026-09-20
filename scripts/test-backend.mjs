/**
 * Backend logic unit tests — no AWS required.
 * Run: node scripts/test-backend.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// ── Inline the logic from categories.js ──────────────────────────────────────
const categoriesSrc = readFileSync(
  new URL('../backend/src/categories.js', import.meta.url),
  'utf8'
);

// Extract CATEGORY_URGENCY entries
const catRe = /'([a-z-]+)':\s*'(critical|high|moderate|low)'/g;
const CATEGORY_URGENCY = {};
let m;
while ((m = catRe.exec(categoriesSrc)) !== null) {
  CATEGORY_URGENCY[m[1]] = m[2];
}
const ALL_VALID_IDS = new Set(Object.keys(CATEGORY_URGENCY));

function resolveServerSeverity(categoryIds) {
  const ids = Array.isArray(categoryIds) ? categoryIds : [];
  const urgencyOrder = ['critical', 'high', 'moderate', 'low'];
  let best = 'moderate';
  for (const id of ids) {
    const urgency = CATEGORY_URGENCY[id];
    if (!urgency) continue;
    if (urgencyOrder.indexOf(urgency) < urgencyOrder.indexOf(best)) best = urgency;
  }
  const URGENCY_TO_SEVERITY = { critical: 'life-threatening', high: 'urgent', moderate: 'moderate', low: 'moderate' };
  return URGENCY_TO_SEVERITY[best] ?? 'moderate';
}

function filterValidCategories(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter(id => ALL_VALID_IDS.has(id));
}

// ── cursor encode/decode (reproducing listIncidents.js logic) ─────────────
function encodeCursor(key) {
  return Buffer.from(JSON.stringify(key)).toString('base64url');
}
function decodeCursor(token) {
  try { return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')); }
  catch { return null; }
}

// ── tests ──────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

console.log('\n=== BACKEND CATEGORY TESTS ===');
assert(ALL_VALID_IDS.size === 52, `52 valid category IDs`);
assert(ALL_VALID_IDS.has('severe-bleeding'), `severe-bleeding in allowlist`);
assert(ALL_VALID_IDS.has('general'), `general in allowlist`);
assert(!ALL_VALID_IDS.has('burns'), `"burns" NOT in allowlist (guide ID, not category ID)`);

console.log('\n=== SEVERITY RESOLUTION TESTS ===');
assert(resolveServerSeverity(['severe-bleeding']) === 'life-threatening', 'severe-bleeding → life-threatening');
assert(resolveServerSeverity(['minor-cuts']) === 'moderate', 'minor-cuts → moderate');
assert(resolveServerSeverity(['fracture']) === 'urgent', 'fracture → urgent');
assert(resolveServerSeverity(['minor-cuts','severe-bleeding']) === 'life-threatening', 'mixed → worst case');
assert(resolveServerSeverity([]) === 'moderate', 'empty → moderate');
assert(resolveServerSeverity(['unknown-id']) === 'moderate', 'unknown id → moderate');
assert(resolveServerSeverity(['anaphylaxis','allergic-reaction']) === 'life-threatening', 'anaphylaxis → life-threatening');
assert(resolveServerSeverity(['sprain-strain','fracture']) === 'urgent', 'sprain+fracture → urgent');

console.log('\n=== FILTER VALID CATEGORIES ===');
assert(filterValidCategories(['severe-bleeding','unknown','fracture']).join() === 'severe-bleeding,fracture', 'filters unknown IDs');
assert(filterValidCategories([]).length === 0, 'empty array → empty');
assert(filterValidCategories(null).length === 0, 'null → empty');
assert(filterValidCategories(['general']).length === 1, 'general is valid');

console.log('\n=== CURSOR ENCODE/DECODE ===');
const key = { id: 'test-incident-123' };
const token = encodeCursor(key);
const decoded = decodeCursor(token);
assert(decoded?.id === key.id, 'cursor round-trips correctly');
assert(decodeCursor('not-valid-base64!!!!') === null, 'invalid cursor returns null');
assert(decodeCursor('') === null, 'empty cursor returns null');

// ── syncIncident validation (inline) ──────────────────────────────────────
console.log('\n=== SYNCINCIDENT VALIDATION ===');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isIsoDate(v) { return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)); }
function isNullOrNumberInRange(v, min, max) {
  if (v === null || v === undefined) return true;
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

assert(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000'), 'UUID regex accepts valid UUID');
assert(!UUID_RE.test('not-a-uuid'), 'UUID regex rejects invalid UUID');
assert(isIsoDate(new Date().toISOString()), 'ISO date validates correctly');
assert(!isIsoDate('not-a-date'), 'non-date string rejected');
assert(isNullOrNumberInRange(null, -90, 90), 'null lat is valid');
assert(isNullOrNumberInRange(8.93, -90, 90), 'valid lat accepted');
assert(!isNullOrNumberInRange(200, -90, 90), 'out-of-range lat rejected');

// ── updateIncident validation ─────────────────────────────────────────────
console.log('\n=== UPDATEINCIDENT VALIDATION ===');
const DEMO_RE = /^demo-\d{4}$/;
assert(DEMO_RE.test('demo-0001'), 'demo-0001 matches demo ID pattern');
assert(!DEMO_RE.test('demo-abc'), 'demo-abc rejected');
assert(!DEMO_RE.test('random'), 'random rejected');

// ── 52 category count from backend ────────────────────────────────────────
console.log('\n=== BACKEND vs TAXONOMY SYNC ===');
const taxonomySrc = readFileSync(
  new URL('../frontend/src/lib/emergencyTaxonomy.js', import.meta.url),
  'utf8'
);
const frontendIds = new Set([...taxonomySrc.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]));
assert(frontendIds.size === 52, `Frontend taxonomy has 52 IDs (got ${frontendIds.size})`);
const backendIds = ALL_VALID_IDS;
const missing = [...frontendIds].filter(id => !backendIds.has(id));
const extra = [...backendIds].filter(id => !frontendIds.has(id));
assert(missing.length === 0, `No frontend IDs missing from backend (missing: ${missing.join(', ') || 'none'})`);
assert(extra.length === 0, `No extra backend IDs not in frontend (extra: ${extra.join(', ') || 'none'})`);

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
