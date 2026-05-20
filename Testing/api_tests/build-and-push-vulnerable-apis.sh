#!/usr/bin/env bash
set -euo pipefail

TAG="${TAG:-latest}"
REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-us-west-2}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

declare -a API_KEYS=("vuln_a" "vuln_b")

repo_name_for() {
  local key="$1"
  if [[ "$key" == "vuln_a" ]]; then
    echo "quickscan-vulnerable-api-auth-injection"
  else
    echo "quickscan-vulnerable-api-config-exposure"
  fi
}

context_dir_for() {
  local key="$1"
  if [[ "$key" == "vuln_a" ]]; then
    echo "${SCRIPT_DIR}/vulnerable_api_auth_injection"
  else
    echo "${SCRIPT_DIR}/vulnerable_api_config_exposure"
  fi
}

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found in PATH." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "============================================"
echo " QuickScanHub — Build & Push 2 Vulnerable APIs"
echo " Tag:    $TAG"
echo " Region: $REGION"
echo "============================================"
echo ""

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_BASE" >/dev/null

for key in "${API_KEYS[@]}"; do
  REPO_NAME="$(repo_name_for "$key")"
  CONTEXT_DIR="$(context_dir_for "$key")"
  ECR_REPO_URI="${ECR_BASE}/${REPO_NAME}"

  echo ">>> [$key] Repo: $REPO_NAME"
  echo ">>> [$key] Context: $CONTEXT_DIR"

  if [[ ! -d "$CONTEXT_DIR" ]]; then
    echo "Context directory not found: $CONTEXT_DIR" >&2
    exit 1
  fi

  if ! aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" >/dev/null 2>&1; then
    aws ecr create-repository --repository-name "$REPO_NAME" --region "$REGION" >/dev/null
  fi

  docker build -t "${REPO_NAME}:${TAG}" "$CONTEXT_DIR"
  docker tag "${REPO_NAME}:${TAG}" "${ECR_REPO_URI}:${TAG}"
  docker push "${ECR_REPO_URI}:${TAG}"

  echo "    ✓ [$key] pushed ${ECR_REPO_URI}:${TAG}"
  echo ""
done

echo "All vulnerable API images pushed successfully."
