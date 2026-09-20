#!/usr/bin/env bash
# Build and deploy the SAM stack (API, DynamoDB, S3 bucket, CloudFront).
# Usage: ./scripts/deploy-backend.sh [--guided]
set -euo pipefail

cd "$(dirname "$0")/../backend"

sam build
sam deploy "$@"

echo
echo "Stack outputs:"
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME:-firstaidflow}" \
  --query "Stacks[0].Outputs[].{Key:OutputKey,Value:OutputValue}" \
  --output table
