#!/bin/bash
# ──────────────────────────────────────────────────────────────
# build-and-push.sh — Build all Docker images and push to ECR
# Run from the quickscan-hub/ root directory
# ──────────────────────────────────────────────────────────────
set -e

REGION="${AWS_DEFAULT_REGION:-us-west-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

echo "============================================"
echo "  QuickScan Hub — Build & Push to ECR"
echo "  Account: $ACCOUNT_ID"
echo "  Region:  $REGION"
echo "============================================"

# Login to ECR
echo ""
echo ">>> Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_BASE

# Create ECR repos if they don't exist
for repo in quickscan-api quickscan-sast-worker quickscan-pentest-worker quickscan-nginx; do
  aws ecr describe-repositories --repository-names $repo --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $repo --region $REGION
done

# Build & push API backend
echo ""
echo ">>> Building API backend..."
docker build -t quickscan-api ./api-backend
docker tag quickscan-api:latest $ECR_BASE/quickscan-api:latest
docker push $ECR_BASE/quickscan-api:latest
echo "    ✓ quickscan-api pushed"

# Build & push SAST worker
echo ""
echo ">>> Building SAST worker..."
docker build -t quickscan-sast-worker ./sast-worker
docker tag quickscan-sast-worker:latest $ECR_BASE/quickscan-sast-worker:latest
docker push $ECR_BASE/quickscan-sast-worker:latest
echo "    ✓ quickscan-sast-worker pushed"

# Build & push Pentest worker
echo ""
echo ">>> Building Pentest worker..."
docker build -t quickscan-pentest-worker ./pentest-worker
docker tag quickscan-pentest-worker:latest $ECR_BASE/quickscan-pentest-worker:latest
docker push $ECR_BASE/quickscan-pentest-worker:latest
echo "    ✓ quickscan-pentest-worker pushed"

# Build & push NGINX (multi-stage: builds frontend + nginx)
# The NGINX Dockerfile expects the frontend source alongside it.
# We build from project root with a specific Dockerfile context.
echo ""
echo ">>> Building NGINX (frontend + reverse proxy)..."
echo "    Step 1: Building frontend..."
cd frontend && npm ci && npm run build && cd ..
echo "    Step 2: Building NGINX image..."
# Copy built frontend into nginx build context
cp -r frontend/dist nginx/dist
docker build -t quickscan-nginx -f nginx/Dockerfile.simple ./nginx
rm -rf nginx/dist
docker tag quickscan-nginx:latest $ECR_BASE/quickscan-nginx:latest
docker push $ECR_BASE/quickscan-nginx:latest
echo "    ✓ quickscan-nginx pushed"

echo ""
echo "============================================"
echo "  All images pushed to ECR successfully!"
echo "  Next: cd terraform && terraform apply"
echo "============================================"
