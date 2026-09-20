// Hackathon scope: CORS is wide open so any origin (localhost, CloudFront,
// a teammate's laptop) can hit the API. Lock ALLOWED_ORIGIN down before
// anything resembling production.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
};

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

export const ok = (body, statusCode = 200) => json(statusCode, body);
export const badRequest = (message) => json(400, { error: message });
export function serverError(err) {
  console.error(err);
  return json(500, { error: 'Internal error' });
}
