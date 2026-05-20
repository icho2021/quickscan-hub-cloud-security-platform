param(
  [string]$Tag = "latest",
  [string]$RepoName = "quickscan-vulnerable-api",
  [string]$Region = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$contextDir = Join-Path $scriptDir "vulnerable_api"
if (-not (Test-Path $contextDir)) {
  throw "Context directory not found: $contextDir"
}

if ([string]::IsNullOrWhiteSpace($Region)) {
  $Region = $env:AWS_DEFAULT_REGION
  if ([string]::IsNullOrWhiteSpace($Region)) {
    $Region = "us-west-2"
  }
}

# AWS CLI: try PATH first, then common AWSCLIV2 location
$awsCmd = Get-Command aws -ErrorAction SilentlyContinue
if ($null -eq $awsCmd) {
  $candidate = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
  if (-not (Test-Path $candidate)) {
    throw "AWS CLI not found. Install AWS CLI v2 or ensure `aws.exe` is in PATH."
  }
  $awsCli = $candidate
} else {
  $awsCli = $awsCmd.Source
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " QuickScanHub — Build & Push Vulnerable API" -ForegroundColor Cyan
Write-Host " Repo:   $RepoName" -ForegroundColor Cyan
Write-Host " Tag:    $Tag" -ForegroundColor Cyan
Write-Host " Region: $Region" -ForegroundColor Cyan
Write-Host "============================================"

Write-Host ""
Write-Host ">>> Getting AWS account ID..." -ForegroundColor DarkYellow
$ACCOUNT_ID = & $awsCli sts get-caller-identity --query Account --output text

$ECR_BASE = "$ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com"
$ECR_REPO_URI = "$ECR_BASE/$RepoName"

Write-Host ""
Write-Host ">>> Logging in to ECR..." -ForegroundColor DarkYellow
& $awsCli ecr get-login-password --region $Region |
  docker login --username AWS --password-stdin $ECR_BASE | Out-Null

Write-Host ""
Write-Host ">>> Ensuring ECR repository exists: $RepoName" -ForegroundColor DarkYellow
$null = & $awsCli ecr describe-repositories --repository-names $RepoName --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
  & $awsCli ecr create-repository --repository-name $RepoName --region $Region | Out-Null
}

Write-Host ""
Write-Host ">>> Building docker image from $contextDir ..." -ForegroundColor DarkYellow
docker build -t "${RepoName}:${Tag}" $contextDir

Write-Host ""
Write-Host ">>> Tagging and pushing to ECR..." -ForegroundColor DarkYellow
docker tag "${RepoName}:${Tag}" "${ECR_REPO_URI}:${Tag}"
docker push "${ECR_REPO_URI}:${Tag}"

Write-Host ""
Write-Host "    ✓ Pushed ${RepoName}:${Tag} to ${ECR_REPO_URI}:${Tag}" -ForegroundColor Green
Write-Host ""
Write-Host "Next: ECS service may need Force new deployment to pull the new image." -ForegroundColor Green

