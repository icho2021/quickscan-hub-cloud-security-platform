#!/usr/bin/env bash
set -euo pipefail

TAG="${TAG:-latest}"
REPO_NAME="${REPO_NAME:-quickscan-vulnerable-api}"
REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-us-west-2}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTEXT_DIR="${SCRIPT_DIR}/vulnerable_api"

if [[ ! -d "$CONTEXT_DIR" ]]; then
  echo "Context directory not found: $CONTEXT_DIR" >&2
  exit 1
fi

echo "============================================"
echo " QuickScanHub — Build & Push Vulnerable API"
echo " Repo:   $REPO_NAME"
echo " Tag:    $TAG"
echo " Region: $REGION"
echo "============================================"
echo ""

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found in PATH. Install AWS CLI v2 or add 'aws' to PATH." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ECR_REPO_URI="${ECR_BASE}/${REPO_NAME}"

echo ">>> Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_BASE" >/dev/null

echo ">>> Ensuring ECR repository exists: $REPO_NAME"
if ! aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws ecr create-repository --repository-name "$REPO_NAME" --region "$REGION" >/dev/null
fi

echo ">>> Building docker image from $CONTEXT_DIR ..."
docker build -t "${REPO_NAME}:${TAG}" "$CONTEXT_DIR"

echo ">>> Tagging and pushing to ECR..."
docker tag "${REPO_NAME}:${TAG}" "${ECR_REPO_URI}:${TAG}"
docker push "${ECR_REPO_URI}:${TAG}"

echo ""
echo "    ✓ Pushed ${REPO_NAME}:${TAG} to ${ECR_REPO_URI}:${TAG}"
echo "Next: ECS service may need Force new deployment to pull the new image."

