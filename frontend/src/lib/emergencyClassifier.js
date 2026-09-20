import { API_BASE_URL } from '../config';
import { classifyLocal, resolveOverallUrgency, TAXONOMY_BY_ID, URGENCY_TO_SEVERITY } from './emergencyTaxonomy';

export { classifyLocal };

/**
 * Derives the display severity from a list of matched category IDs.
 * Uses the taxonomy — never AI-provided severity.
 */
export function severityFromCategories(categoryIds) {
  const urgency = resolveOverallUrgency(categoryIds);
  return URGENCY_TO_SEVERITY[urgency] ?? 'moderate';
}

/**
 * Returns true if any matched category requires emergency services.
 */
export function requiresEmergencyServices(categoryIds) {
  return categoryIds.some((id) => TAXONOMY_BY_ID[id]?.requiresEmergencyServices);
}

/**
 * Classify an emergency description. Uses the AWS Bedrock guidance endpoint
 * when available and online; falls back to the local taxonomy classifier.
 *
 * Returns:
 *   { categoryIds, clarifyingQuestion, confident, source }
 */
export async function classifyEmergency(text, { signal } = {}) {
  if (!API_BASE_URL) {
    return _wrapLocal(classifyLocal(text));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  const requestSignal = signal || controller.signal;

  try {
    const res = await fetch(`${API_BASE_URL}/guidance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: requestSignal,
    });

    if (!res.ok) throw new Error(`guidance HTTP ${res.status}`);

    const data = await res.json();

    // Validate all returned category IDs against the taxonomy
    const validIds = Array.isArray(data.categoryIds)
      ? data.categoryIds.filter((id) => id in TAXONOMY_BY_ID)
      : [];

    // Backward-compat: old response shape used guideIds
    const legacyIds = Array.isArray(data.guideIds)
      ? data.guideIds.filter((id) => id in TAXONOMY_BY_ID)
      : [];

    const categoryIds = validIds.length ? validIds : legacyIds.length ? legacyIds : ['general'];

    return {
      categoryIds,
      clarifyingQuestion: typeof data.clarifyingQuestion === 'string' ? data.clarifyingQuestion : null,
      confident: Boolean(data.confident && !categoryIds.every((id) => id === 'general')),
      source: 'aws-guidance',
    };
  } catch {
    return { ..._wrapLocal(classifyLocal(text)), source: 'verified-local-fallback' };
  } finally {
    clearTimeout(timer);
  }
}

function _wrapLocal(local) {
  return {
    categoryIds: local.categoryIds,
    clarifyingQuestion: null,
    confident: local.confident,
    source: local.source,
  };
}

// Legacy compat shims for components that still use the old API shape
export function classifyEmergencyLocal(text) {
  const result = classifyLocal(text);
  const guideId = result.categoryIds[0] ?? null;
  return {
    guideId,
    guideIds: result.categoryIds,
    categoryIds: result.categoryIds,
    matchedKeyword: null,
    urgentOverride: result.urgentOverride,
    confident: result.confident,
    source: result.source,
  };
}
