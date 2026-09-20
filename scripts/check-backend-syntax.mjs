/**
 * Backend syntax check — run without any AWS or network access.
 * Uses Node's --check flag on each backend source file.
 * Run: node scripts/check-backend-syntax.mjs
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendSrc = path.join(__dirname, '..', 'backend', 'src');

const files = [
  'categories.js',
  'guidance.js',
  'listIncidents.js',
  'syncIncident.js',
  'updateIncident.js',
  'lib/response.js',
];

let allOk = true;
for (const f of files) {
  const full = path.join(backendSrc, f);
  if (!existsSync(full)) {
    console.error(`MISSING: ${f}`);
    allOk = false;
    continue;
  }
  try {
    execSync(`node --check "${full}"`, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(`SYNTAX OK: ${f}`);
  } catch (err) {
    const stderr = err.stderr?.toString() ?? err.message;
    console.error(`SYNTAX ERROR: ${f}\n  ${stderr.trim()}`);
    allOk = false;
  }
}

console.log(allOk ? '\nAll backend files syntax-valid.' : '\nSyntax errors found.');
if (!allOk) process.exit(1);
