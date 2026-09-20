import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ok, serverError } from './lib/response.js';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Encode a DynamoDB LastEvaluatedKey as a URL-safe cursor token.
 * The key is JSON-serialised then base64url-encoded so it is opaque
 * to clients and safe to round-trip through query strings.
 */
function encodeCursor(key) {
  return Buffer.from(JSON.stringify(key)).toString('base64url');
}

/**
 * Decode a cursor token back to a DynamoDB ExclusiveStartKey.
 * Returns null on any parse failure so the caller can ignore a bad cursor.
 */
function decodeCursor(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * GET /incidents?limit=50&cursor=<token>
 *
 * Returns one page of incidents.  Because DynamoDB's primary key is `id`
 * (a UUID) there is no native sort order by timestamp without a GSI.
 * Scan order is not guaranteed to be chronological.  A production deployment
 * should add a GSI with a fixed partition key + timestamp sort key to enable
 * efficient time-ordered queries; that limitation is documented in the README.
 *
 * The cursor is DynamoDB's LastEvaluatedKey encoded as base64url.  Pass the
 * nextCursor value from one response as the cursor query parameter in the next
 * request to retrieve the following page.
 *
 * Response shape:
 *   { "incidents": [...], "count": N, "nextCursor": "..." | null }
 */
export const handler = async (event) => {
  const qs = event.queryStringParameters ?? {};

  // Parse and clamp limit
  const rawLimit = parseInt(qs.limit ?? DEFAULT_LIMIT, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  // Decode cursor (ExclusiveStartKey for DynamoDB)
  const exclusiveStartKey = decodeCursor(qs.cursor ?? null);

  try {
    const page = await ddb.send(new ScanCommand({
      TableName: TABLE,
      Limit: limit,
      ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    }));

    const items = page.Items ?? [];
    const nextCursor = page.LastEvaluatedKey
      ? encodeCursor(page.LastEvaluatedKey)
      : null;

    return ok({
      incidents: items,
      count: items.length,
      nextCursor,
    });
  } catch (err) {
    return serverError(err);
  }
};
