#!/usr/bin/env bash
# Build the PWA against the deployed API and publish it to S3 + CloudFront.
#
# Cache strategy (this is what makes redeploys pick up cleanly on phones):
#   - hashed assets (/assets/*, workbox-*.js) -> 1 year, immutable
#   - index.html, sw.js, registerSW.js, manifest.webmanifest -> no-cache
# CloudFront uses a cache policy that honours these headers exactly.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK="${STACK_NAME:-firstaidflow}"

output() {
  aws cloudformation describe-stacks --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

API_URL="$(output ApiBaseUrl)"
BUCKET="$(output WebBucketName)"
DIST_ID="$(output DistributionId)"
WEB_URL="$(output WebUrl)"

echo "API:     $API_URL"
echo "Bucket:  $BUCKET"
echo "CDN:     $WEB_URL"
echo

cd "$ROOT/frontend"
if [ -f package-lock.json ]; then npm ci; else npm install; fi
VITE_API_BASE_URL="$API_URL" npm run build

VOLATILE=(index.html sw.js registerSW.js manifest.webmanifest)

# 1. Everything hashed: cache forever. Excluded files are handled below.
SYNC_ARGS=()
for f in "${VOLATILE[@]}"; do SYNC_ARGS+=(--exclude "$f"); done
aws s3 sync dist/ "s3://$BUCKET/" --delete "${SYNC_ARGS[@]}" \
  --cache-control "public,max-age=31536000,immutable"

# 2. Entry points the browser must always revalidate.
for f in "${VOLATILE[@]}"; do
  [ -f "dist/$f" ] || continue
  case "$f" in
    *.html) ct="text/html; charset=utf-8" ;;
    *.js) ct="application/javascript; charset=utf-8" ;;
    *.webmanifest) ct="application/manifest+json" ;;
    *) ct="application/octet-stream" ;;
  esac
  aws s3 cp "dist/$f" "s3://$BUCKET/$f" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --content-type "$ct"
done

# 3. Purge the volatile paths at the edge so the new SW is served immediately.
PATHS=("/")
for f in "${VOLATILE[@]}"; do PATHS+=("/$f"); done
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "${PATHS[@]}" >/dev/null

echo
echo "Deployed: $WEB_URL"
