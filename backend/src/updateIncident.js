import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ok, badRequest, serverError } from './lib/response.js';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE = process.env.TABLE_NAME;

// Only status transitions we will honour. Keeping it minimal for the
// hackathon scope; extend this list if more transitions are needed.
const ALLOWED_STATUSES = new Set(['resolved', 'open']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Demo incidents use a "demo-NNNN" id format — allow those too.
const DEMO_RE = /^demo-\d{4}$/;

/** PATCH /incidents/{id}  — update status of a known incident */
export const handler = async (event) => {
  const id = event.pathParameters?.id;

  if (!id || (!UUID_RE.test(id) && !DEMO_RE.test(id))) {
    return badRequest('Path parameter {id} must be a UUID');
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return badRequest('Body must be valid JSON');
  }

  if (!('status' in body)) {
    return badRequest('Body must include a "status" field');
  }

  const { status } = body;
  if (!ALLOWED_STATUSES.has(status)) {
    return badRequest(`status must be one of: ${[...ALLOWED_STATUSES].join(', ')}`);
  }

  const resolved = status === 'resolved';

  // Verify the incident exists before attempting an update, so we can return
  // a clean 404 instead of silently creating an orphan record.
  try {
    const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (!existing.Item) {
      return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Incident not found' }) };
    }
  } catch (err) {
    return serverError(err);
  }

  const updatedAt = new Date().toISOString();

  try {
    const result = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'SET resolved = :resolved, updated_at = :updatedAt',
        ExpressionAttributeValues: {
          ':resolved': resolved,
          ':updatedAt': updatedAt,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    const item = result.Attributes;
    return ok({
      id: item.id,
      status: item.resolved ? 'resolved' : 'open',
      resolved: item.resolved,
      updated_at: item.updated_at,
    });
  } catch (err) {
    return serverError(err);
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  };
}
