# FirstAidFlow

**Offline-first emergency guidance and coordination PWA**

FirstAidFlow is a Progressive Web App that provides verified first-aid guidance and incident coordination support for emergency responders and bystanders. It works fully offline once installed.

---

## Emergency Coverage

- **52 recognised emergency categories** across 6 groups
- **27 verified step-by-step guidance guides** (sourced from Red Cross, St John Ambulance, NHS, and specialist charities)
- **13 escalation-only categories** — these categories are recognised and routed, but the correct response is to call emergency services immediately; no fictional step-by-step guides are bundled for them
- **12 additional categories** share an existing verified guide (e.g. _Amputation_ uses the _Severe Bleeding_ guide; _Frostbite_ uses the _Hypothermia_ guide)
- Natural-language emergency description via the Guidance Console
- AWS Bedrock used for natural-language **classification only** — never for generating medical treatment instructions
- Verified guide content is the sole source of all first-aid instructions

> **Terminology clarification:** A _recognised category_ is a scenario the system can classify. A _verified guide_ is a distinct step-by-step walkthrough. Multiple categories can share one guide where the first-aid response is identical or closely related.

---

## Architecture

### Frontend (PWA)

- React + Vite
- Service worker (Workbox) for offline-first operation
- IndexedDB (via `idb`) for offline incident storage
- Automatic sync queue: incidents created offline are synced when connectivity is restored
- 52-category emergency taxonomy compiled into the bundle — classification works fully offline

### Backend (AWS Serverless)

- **API Gateway** with throttling (100 req/s burst, 50 req/s steady)
- **AWS Lambda** (Node.js 24 / arm64) functions:
  - `POST /guidance` — Bedrock classification endpoint
  - `POST /incidents` — create/sync incident
  - `GET /incidents?limit=50&cursor=<token>` — cursor-paginated incident list
  - `PATCH /incidents/{id}` — resolve/update incident
- **DynamoDB** (PAY_PER_REQUEST) — stores coordinated incident data
- **S3 + CloudFront** — hosts the built PWA with HTTPS
- **AWS Bedrock** (Amazon Nova Lite) — natural-language classification only

### Incident Coordination

- Coordinator dashboard shows active incidents with severity indicators
- Incident map shows relative incident positions
- Cluster detection highlights surge situations
- Incidents created offline appear in the local view immediately and sync automatically

---

## API: Cursor Pagination

`GET /incidents` supports cursor-based pagination:

```
GET /incidents?limit=50
GET /incidents?limit=50&cursor=<nextCursor from previous response>
```

Response shape:
```json
{
  "incidents": [...],
  "count": 50,
  "nextCursor": "eyJpZCI6..."
}
```

`nextCursor` is `null` when there are no more pages.

> **Known limitation:** DynamoDB's primary key is `id` (UUID). Without a GSI keyed on a fixed partition + timestamp sort key, the Scan order is not guaranteed to be chronological. A production deployment should add a GSI for time-ordered queries. The Scan-based pagination is bounded and safe for the hackathon scope.

---

## API Configuration

Set `VITE_API_BASE_URL` in `frontend/.env`:

```bash
# Offline mode — incidents queue locally in IndexedDB and are never synced
VITE_API_BASE_URL=

# AWS mode — set to the API Gateway stage URL from SAM outputs
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod
```

When `VITE_API_BASE_URL` is empty, the app runs in full offline mode. This is not an error — the guidance console, guide walkthroughs, and incident creation all function without a backend.

---

## Authentication

**Current status: unauthenticated**

The API endpoints do not currently require authentication. This is intentional for the hackathon demo and offline-first flow. For production:

- Add Amazon Cognito authoriser to API Gateway
- Restrict the `AllowedOrigin` parameter to the deployed CloudFront domain
- Consider IP-based rate limiting at CloudFront level

The application is not designed to store personally identifiable information. Incident descriptions are user-provided free text and should be treated as potentially sensitive.

---

## CORS

Default `AllowedOrigin: '*'` is set for local development and demo use.

For production, update the `AllowedOrigin` SAM parameter to your CloudFront distribution URL:

```bash
sam deploy --parameter-overrides AllowedOrigin=https://d1example.cloudfront.net
```

API Gateway is configured for: `GET, POST, PATCH, OPTIONS`

---

## Classification Logic

The Bedrock guidance endpoint classifies free-text descriptions into the 52-category taxonomy. All returned category IDs are validated against the allowlist — the model cannot invent new categories or severity levels.

When Bedrock is unavailable (offline or not configured), the local deterministic classifier runs keyword matching against the taxonomy. **Severity is always derived deterministically from the taxonomy, never from AI output.**

Flow:
```
User description
  → Bedrock classification (if online + configured)
      → validated against 52-category allowlist
  → OR local taxonomy classifier (offline / API unavailable)
  → taxonomy-derived urgency/severity (deterministic)
  → verified guide or escalation-only response
```

The model may return an `urgentOverride` flag as an internal safety signal; this flag is **never used to determine the displayed severity**. Severity is always resolved from `category → taxonomy urgency → display severity`.

---

## Offline Mode

The following functions without any network connection:

- PWA install and launch
- Emergency guidance console (local keyword classifier)
- All 27 guide walkthroughs
- Category browse / search (GuideList)
- Incident creation (stored in IndexedDB)
- Queued sync (incidents sync automatically when connectivity returns)

The UI clearly distinguishes between:
- **Offline / local mode** — `VITE_API_BASE_URL` is empty; incidents queue locally
- **API unavailable** — URL is configured but the request failed; local fallback is used for classification

---

## Local Development

```bash
# Frontend
cd frontend
cp .env.example .env   # Edit VITE_API_BASE_URL if using backend
npm ci
npm run dev

# Backend
cd backend
sam build
sam local start-api    # Requires Docker + AWS credentials
```

## Production Deployment

```bash
# Build and deploy backend
cd backend
sam build
sam deploy --guided

# Build and deploy frontend
cd frontend
npm run build
# Upload dist/ to the S3 bucket from SAM outputs
aws s3 sync dist/ s3://<WebBucketName> --delete
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

---

## Medical Safety

FirstAidFlow provides first-aid guidance only. It does not:

- Diagnose medical conditions
- Prescribe medication
- Replace emergency medical professionals
- Guarantee outcomes

In all life-threatening situations, the application prioritises calling emergency services (112 / 911 / local number). Verified guides are the sole source of first-aid instructions. AWS Bedrock is used only for description classification and is explicitly prevented from generating medical treatment content.

For escalation-only categories (e.g. crush injury, neck/spinal injury, carbon monoxide exposure), the app advises calling emergency services immediately and does not bundle a step-by-step guide — because in those situations getting professional help started is the correct and safe response.

---

## Guide Sources

All 27 guidance guides are sourced from or cross-referenced with authoritative first-aid organisations. See `/sources` in the app or `frontend/src/guides/sources.js`.

Key sources include: British Red Cross, St John Ambulance, NHS, Asthma UK, Stroke Association UK, Epilepsy Action, American Heart Association.
