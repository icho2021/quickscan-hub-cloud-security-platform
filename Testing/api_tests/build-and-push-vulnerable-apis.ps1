param(
  [string]$Tag = "latest",
  [string]$Region = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Region)) {
  $Region = $env:AWS_DEFAULT_REGION
  if ([string]::IsNullOrWhiteSpace($Region)) {
    $Region = "us-west-2"
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$awsCmd = Get-Command aws -ErrorAction SilentlyContinue
if ($null -eq $awsCmd) {
  $candidate = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
  if (-not (Test-Path $candidate)) {
    throw "AWS CLI not found. Install AWS CLI v2 or add aws.exe to PATH."
  }
  $awsCli = $candidate
} else {
  $awsCli = $awsCmd.Source
}

$apis = @(
  @{
    Key = "vuln_a"
    RepoName = "quickscan-vulnerable-api-auth-injection"
    ContextDir = Join-Path $scriptDir "vulnerable_api_auth_injection"
  },
  @{
    Key = "vuln_b"
    RepoName = "quickscan-vulnerable-api-config-exposure"
    ContextDir = Join-Path $scriptDir "vulnerable_api_config_exposure"
  }
)

$accountId = & $awsCli sts get-caller-identity --query Account --output text
$ecrBase = "$accountId.dkr.ecr.$Region.amazonaws.com"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " QuickScanHub — Build & Push 2 Vulnerable APIs" -ForegroundColor Cyan
Write-Host " Tag:    $Tag" -ForegroundColor Cyan
Write-Host " Region: $Region" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

& $awsCli ecr get-login-password --region $Region |
  docker login --username AWS --password-stdin $ecrBase | Out-Null

foreach ($api in $apis) {
  $repoName = $api.RepoName
  $contextDir = $api.ContextDir
  $ecrRepoUri = "$ecrBase/$repoName"

  Write-Host ">>> [$($api.Key)] Repo: $repoName" -ForegroundColor DarkYellow
  Write-Host ">>> [$($api.Key)] Context: $contextDir" -ForegroundColor DarkYellow

  if (-not (Test-Path $contextDir)) {
    throw "Context directory not found: $contextDir"
  }

  $null = & $awsCli ecr describe-repositories --repository-names $repoName --region $Region 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $awsCli ecr create-repository --repository-name $repoName --region $Region | Out-Null
  }

  docker build -t "${repoName}:${Tag}" $contextDir
  docker tag "${repoName}:${Tag}" "${ecrRepoUri}:${Tag}"
  docker push "${ecrRepoUri}:${Tag}"

  Write-Host "    ✓ [$($api.Key)] pushed ${ecrRepoUri}:${Tag}" -ForegroundColor Green
  Write-Host ""
}

Write-Host "All vulnerable API images pushed successfully." -ForegroundColor Green
