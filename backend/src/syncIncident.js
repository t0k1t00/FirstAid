import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ok, badRequest, serverError } from './lib/response.js';
import { ALL_VALID_IDS, filterValidCategories, resolveServerSeverity } from './categories.js';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE = process.env.TABLE_NAME;
const SOURCES = new Set(['guide', 'ai-guidance']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST /incidents */
export const handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return badRequest('Body must be valid JSON');
  }

  const errors = validate(body);
  if (errors.length) return badRequest(errors.join('; '));

  // Resolve category IDs — prefer new field, fall back to legacy injury_type
  const rawCategoryIds = Array.isArray(body.categoryIds) && body.categoryIds.length
    ? body.categoryIds
    : [body.injury_type];

  const categoryIds = filterValidCategories(rawCategoryIds);
  if (!categoryIds.length) {
    return badRequest(`No valid category IDs. Must be from the approved list.`);
  }

  // Primary category for backward-compat (legacy injury_type field)
  const primaryCategory = categoryIds[0];

  // Server derives severity — never trust client-provided value
  const derivedSeverity = resolveServerSeverity(categoryIds);

  const item = {
    id: body.id,
    injury_type: primaryCategory,          // legacy compat
    categoryIds,                            // v7 field
    severity: derivedSeverity,             // server-derived
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    location_accuracy: body.location_accuracy ?? null,
    location_timestamp: body.location_timestamp ?? null,
    timestamp: body.timestamp,
    resolved: body.resolved,
    source: SOURCES.has(body.source) ? body.source : 'guide',
    description: typeof body.description === 'string' ? body.description.slice(0, 500) : null,
    location_note: typeof body.location_note === 'string' ? body.location_note.slice(0, 160) : null,
    synced_at: new Date().toISOString(),
  };

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)',
    }));
    return ok({ id: item.id, synced_at: item.synced_at }, 201);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return ok({ id: item.id, duplicate: true });
    }
    return serverError(err);
  }
};

function validate(b) {
  const errors = [];
  if (typeof b.id !== 'string' || !UUID_RE.test(b.id)) errors.push('id must be a UUID');

  // Accept either new categoryIds or legacy injury_type
  const hasCategoryIds = Array.isArray(b.categoryIds) && b.categoryIds.length > 0;
  const hasInjuryType = typeof b.injury_type === 'string' && ALL_VALID_IDS.has(b.injury_type);
  if (!hasCategoryIds && !hasInjuryType) {
    errors.push('body must include valid categoryIds array or injury_type');
  }

  if (!isIsoDate(b.timestamp)) errors.push('timestamp must be an ISO-8601 date string');
  if (!isNullOrNumberInRange(b.lat, -90, 90)) errors.push('lat must be null or between -90 and 90');
  if (!isNullOrNumberInRange(b.lng, -180, 180)) errors.push('lng must be null or between -180 and 180');
  if (!isNullOrNumberInRange(b.location_accuracy, 0, 100000)) errors.push('location_accuracy must be null or between 0 and 100000');
  if (!isNullOrDate(b.location_timestamp)) errors.push('location_timestamp must be null or an ISO-8601 date string');
  if (typeof b.resolved !== 'boolean') errors.push('resolved must be true or false');
  return errors;
}

function isIsoDate(v) { return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)); }
function isNullOrDate(v) { return v === null || v === undefined || isIsoDate(v); }
function isNullOrNumberInRange(v, min, max) {
  if (v === null || v === undefined) return true;
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}
