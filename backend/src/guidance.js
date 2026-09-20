import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { ok, badRequest, serverError } from './lib/response.js';
import { ALL_VALID_IDS, filterValidCategories } from './categories.js';

const client = new BedrockRuntimeClient({});
const MODEL_ID = process.env.GUIDANCE_MODEL_ID;

const ALL_IDS_LIST = [...ALL_VALID_IDS].join(', ');

const SYSTEM = `You are the FirstAidFlow Emergency Guidance interpretation service.
You are not a doctor. Do NOT diagnose, prescribe medication, invent treatment instructions, or advise delaying emergency services.

Your only job is to interpret the user's emergency description and classify it into one or more categories from this exact allowlist:
${ALL_IDS_LIST}

Rules:
- Return JSON only, no prose, no markdown fences.
- Use only IDs from the allowlist above. Never invent IDs.
- If you are unsure, use "general".
- Set urgentOverride true only for obvious immediate life threats (cardiac arrest, severe bleeding, drowning, anaphylaxis, etc.).
- If the description is ambiguous and a single short yes/no question would meaningfully narrow it down, set clarifyingQuestion to that question. Otherwise null.
- Do not provide any medical treatment instructions.

Response format:
{"categoryIds": string[], "clarifyingQuestion": string | null, "confident": boolean, "urgentOverride": boolean}`;

export const handler = async (event) => {
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Body must be valid JSON'); }
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 1200) : '';
  if (!text) return badRequest('text is required');
  if (!MODEL_ID) return serverError(new Error('GUIDANCE_MODEL_ID is not configured'));

  try {
    const response = await client.send(new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: SYSTEM }],
      messages: [{ role: 'user', content: [{ text }] }],
      inferenceConfig: { maxTokens: 200, temperature: 0 },
    }));

    const raw = response.output?.message?.content?.map((x) => x.text || '').join('') || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model did not return JSON');

    const parsed = JSON.parse(match[0]);

    // Validate and allowlist all returned IDs
    const rawIds = Array.isArray(parsed.categoryIds)
      ? parsed.categoryIds
      : Array.isArray(parsed.guideIds) ? parsed.guideIds : ['general'];

    const categoryIds = filterValidCategories(rawIds);
    const normalized = categoryIds.length ? categoryIds : ['general'];

    // Sanitize clarifying question
    const clarifyingQuestion =
      typeof parsed.clarifyingQuestion === 'string' &&
      parsed.clarifyingQuestion.trim().length > 0 &&
      parsed.clarifyingQuestion.trim().length < 200
        ? parsed.clarifyingQuestion.trim()
        : null;

    return ok({
      categoryIds: normalized,
      // Legacy compat
      guideId: normalized[0],
      guideIds: normalized,
      clarifyingQuestion,
      confident: Boolean(parsed.confident && !normalized.every((id) => id === 'general')),
      // urgentOverride is NOT forwarded to the frontend. Severity is derived
      // deterministically from the taxonomy in the client. This field is
      // retained in the model prompt only as an internal safety-logging signal
      // and is intentionally discarded here.
    });
  } catch (err) {
    return serverError(err);
  }
};
