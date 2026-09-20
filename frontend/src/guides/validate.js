// Dev-time sanity check: every `next` must point at a real step, every
// decision must have options, every terminal must have a CTA.
export function validateGuide(guide) {
  const ids = new Set(guide.steps.map((s) => s.id));
  const problems = [];

  if (!ids.has(guide.start)) problems.push(`start "${guide.start}" does not exist`);

  for (const step of guide.steps) {
    if (step.type === 'decision') {
      if (!Array.isArray(step.options) || step.options.length < 2) {
        problems.push(`${step.id}: decision needs at least 2 options`);
      } else {
        for (const opt of step.options) {
          if (!ids.has(opt.next)) problems.push(`${step.id} -> "${opt.next}" does not exist`);
        }
      }
    } else if (step.type === 'instruction') {
      if (!ids.has(step.next)) problems.push(`${step.id} -> "${step.next}" does not exist`);
    } else if (step.type === 'terminal') {
      if (!step.cta) problems.push(`${step.id}: terminal step missing cta`);
    } else {
      problems.push(`${step.id}: unknown type "${step.type}"`);
    }
  }

  return problems;
}
