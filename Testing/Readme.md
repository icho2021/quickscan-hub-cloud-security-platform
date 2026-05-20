# SAST Test Suite Documentation

## Overview

This directory contains comprehensive test files for the QuickScan Hub SAST (Static Application Security Testing) scanner. The suite demonstrates and validates detection of **11 different security vulnerability types** in JavaScript code.

---

## Test Files Organization

### 📁 Code Testing/

All test files are organized in the `Code Testing` subdirectory (12 files total).

#### Files by Vulnerability Type

| # | Vulnerability Type | Test File | Severity | Description |
|---|---|---|---|---|
| 1 | **HARDCODED_SECRET** | `test-hardcoded-secret.js` | 🔴 HIGH | API keys, passwords, AWS credentials hardcoded in source |
| 2 | **NOSQL_INJECTION** | `test-nosql-injection.js` | 🔴 HIGH | MongoDB query injection through unsanitized user input |
| 3 | **XSS** | `test-xss.js` | 🔴 HIGH | Cross-Site Scripting: innerHTML, dangerouslySetInnerHTML, etc. |
| 4 | **PATH_TRAVERSAL** | `test-path-traversal.js` | 🔴 HIGH | Directory traversal attacks via file operations |
| 5 | **INSECURE_FUNCTION** | `test-insecure-function.js` | 🔴 HIGH | Dangerous functions: eval(), exec(), new Function() |
| 6 | **SQL_INJECTION** | `test-sql-injection.js` | 🔴 HIGH | SQL query injection through string concatenation |
| 7 | **INSECURE_RANDOM** | `test-insecure-random.js` | 🟡 MEDIUM | Math.random() for cryptographic purposes |
| 8 | **SENSITIVE_DATA_LOG** | `test-sensitive-data-log.js` | 🟡 MEDIUM | Passwords, tokens logged to console |
| 9 | **HARDCODED_IP** | `test-hardcoded-ip.js` | 🟡 MEDIUM | Server IPs hardcoded in source code |
| 10 | **WEAK_CRYPTO** | `test-weak-crypto.js` | 🟡 MEDIUM | MD5, SHA1 for cryptographic operations |
| 11 | **SECURITY_TODO** | `test-security-todo.js` | 🟢 LOW | FIXME/TODO comments related to security |
| — | **COMPREHENSIVE** | `test-vulnerabilities.js` | MIXED | Combined test with examples of all 11 types |

---

## Understanding Key Vulnerability Types

### 1. HARDCODED_SECRET
- **Risk:** API keys, passwords directly in source code
- **Fix:** Use environment variables: `process.env.API_KEY`
- **Example:** Banking APIs, AWS credentials

### 2. NOSQL_INJECTION
- **Risk:** MongoDB queries with unsanitized user input using `$ne`, `$where`
- **Fix:** Parameterized queries and input validation
- **Example:** Bypassing authentication with `{ "$ne": null }`

### 3. XSS (Cross-Site Scripting)
- **Risk:** Unescaped HTML injection via innerHTML, dangerouslySetInnerHTML
- **Fix:** Use textContent or templating with auto-escape
- **Example:** Stealing cookies with malicious script injection

### 4. PATH_TRAVERSAL
- **Risk:** File access outside intended directory using `../`
- **Fix:** Validate and normalize file paths before access
- **Example:** Reading `/etc/passwd` via `../../etc/passwd`

### 5. INSECURE_FUNCTION
- **Risk:** eval(), exec(), execSync(), new Function() executing user code
- **Fix:** Use safe alternatives (math libraries, templating engines)
- **Example:** `eval("process.exit()")` crashes the app

### 6. SQL_INJECTION
- **Risk:** SQL queries built via string concatenation
- **Fix:** Always use parameterized queries
- **Example:** `admin' OR '1'='1` bypasses login

### 7. INSECURE_RANDOM
- **Risk:** Math.random() for tokens/session IDs (not cryptographically secure)
- **Fix:** Use crypto.randomBytes()
- **Example:** Guessing session tokens

### 8. SENSITIVE_DATA_LOG
- **Risk:** Passwords, tokens, PII logged to console
- **Fix:** Only log generic messages, never log secrets
- **Example:** Password appearing in server logs

### 9. HARDCODED_IP
- **Risk:** Server IPs hardcoded in source
- **Fix:** Use environment configuration
- **Example:** Cannot change infrastructure without code change

### 10. WEAK_CRYPTO
- **Risk:** Using MD5, SHA1 which are cryptographically broken
- **Fix:** Use SHA256+, bcrypt for passwords
- **Example:** MD5 collisions are trivial with modern tools

### 11. SECURITY_TODO
- **Risk:** Unimplemented security measures marked as TODO
- **Fix:** Complete security fixes before deployment
- **Example:** "TODO: Add input validation"

---

## How to Run the Tests

### Scan All Vulnerabilities
\`\`\`bash
node ../demo-scan.js "Code Testing/test-vulnerabilities.js"
\`\`\`
Expected output: `47 vulnerabilities detected`

### Scan Specific Vulnerability Type
\`\`\`bash
node ../demo-scan.js "Code Testing/test-xss.js"
node ../demo-scan.js "Code Testing/test-sql-injection.js"
\`\`\`

---

## Vulnerability Statistics

| Level | Count | Examples |
|-------|-------|----------|
| 🔴 HIGH | 7 types | Injection, XSS, Code Execution |
| 🟡 MEDIUM | 3 types | Weak crypto, Insecure random |
| 🟢 LOW | 1 type | Security TODO |

---

## Key Security Principles

✅ **DO:**
- Use environment variables for secrets
- Sanitize and validate all user input
- Use parameterized queries
- Use bcrypt/scrypt for passwords
- Use crypto.randomBytes() for tokens
- Escape HTML output

❌ **DON'T:**
- Hardcode API keys, passwords, IPs
- Use eval(), exec() with user input
- Use Math.random() for security
- Log passwords or tokens
- Use MD5 or SHA1
- Leave security TODOs unfinished

---

**Test Count:** 12 files (1 comprehensive + 11 specialized)  
**Total Examples:** 100+ vulnerable code snippets  
**Coverage:** 11 different vulnerability types  
**Last Updated:** March 25, 2026

---

## API Testing (Vulnerable Test Target)

This project includes intentionally vulnerable APIs that can be deployed to AWS (Learner Lab) and used as pentest scan targets from the QuickScanHub frontend.

### Directory Structure

- `Testing/api_tests/vulnerable_api/` — Legacy all-in-one vulnerable API (kept for compatibility)
- `Testing/api_tests/vulnerable_api_auth_injection/` — API-A (auth and injection vulnerabilities)
- `Testing/api_tests/vulnerable_api_config_exposure/` — API-B (rate-limit, headers, data exposure vulnerabilities)
- `Testing/api_tests/vulnerable_api_tf/` — Standalone Terraform project that deploys both APIs in one apply
- `Testing/api_tests/build-and-push-vulnerable-apis.ps1` — Build and push API-A + API-B images (PowerShell)
- `Testing/api_tests/build-and-push-vulnerable-apis.sh` — Build and push API-A + API-B images (bash)

### What the Pentest Worker Detects

The pentest worker runs 6 tests against a single `targetUrl`. The checks are pattern-based, so endpoint behavior and response strings matter.

| Test ID | Severity | Request shape | Typical fail signal |
|---|---:|---|---|
| `AUTH_MISSING` | HIGH | `GET targetUrl` | `200` with meaningful response body |
| `SQL_INJECTION` | HIGH | GET with SQL payload in query params + POST payloads | SQL error keywords (`sql`, `syntax`, `mysql`, etc.) in response |
| `NOSQL_INJECTION` | HIGH | `POST` JSON object payloads (`$ne`, `$where`, etc.) | Mongo-related error text or unexpected data response |
| `RATE_LIMITING` | MEDIUM | 20 rapid `GET` requests | No `429` and all requests succeed |
| `SECURITY_HEADERS` | MEDIUM | `GET targetUrl`, inspect headers | Missing/misconfigured security headers, server tech leakage |
| `SENSITIVE_DATA_EXPOSURE` | HIGH | GET body scan + POST invalid body | Sensitive patterns (password/apiKey/secret/stack/mongodb://) |

Notes:
- One scan job has one `targetUrl`; run multiple scans for full coverage.
- `runAllTests()` applies all 6 tests sequentially to the same URL.

### Two-API Vulnerability Split (3:3)

| API | Routed prefix | Assigned vulnerabilities | Recommended scan target URLs |
|---|---|---|---|
| API-A `vuln_a` (`vulnerable_api_auth_injection`) | `/a` | `AUTH_MISSING`, `SQL_INJECTION`, `NOSQL_INJECTION` | `/a/api/users`, `/a/api/user`, `/a/api/login` |
| API-B `vuln_b` (`vulnerable_api_config_exposure`) | `/b` | `RATE_LIMITING`, `SECURITY_HEADERS`, `SENSITIVE_DATA_EXPOSURE` | `/b/api/users`, `/b/api/security`, `/b/api/data` |

### What This Deploy Creates

One Terraform apply creates:
- **Networking**: VPC, 2 public subnets, IGW, route table + associations
- **Load Balancer**: one public ALB and one listener with path-based routing (`/a/*`, `/b/*`)
- **Compute**: one ECS cluster and two Fargate services/task definitions (A/B)
- **Registry/Logs**: two ECR repositories + two CloudWatch log groups

### Deploy Steps (Learner Lab)

#### 1) Export AWS Credentials

Set Learner Lab credentials in your shell session (example):

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
export AWS_DEFAULT_REGION="us-west-2"
```

#### 2) Deploy Infrastructure (Terraform)

From the repo root:

```bash
cd Testing/api_tests/vulnerable_api_tf
terraform init
terraform apply
```

#### 3) Build and Push Both API Images (must include `latest`)

PowerShell:

```powershell
cd .\Testing\api_tests
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-and-push-vulnerable-apis.ps1
```

bash:

```bash
cd Testing/api_tests
bash ./build-and-push-vulnerable-apis.sh
```


### How to Test from QuickScanHub Frontend

In the QuickScanHub UI:
- Go to **Pentest — API Penetration Testing**
- Paste a **full target URL** (must include `http://`)
- Click **Run Pentest Scan**

Recommended target URLs (one per scan):
- API-A: `http://<vuln-alb-dns>/a/api/users` (auth check)
- API-A: `http://<vuln-alb-dns>/a/api/user` (SQL injection check)
- API-A: `http://<vuln-alb-dns>/a/api/login` (NoSQL injection check)
- API-B: `http://<vuln-alb-dns>/b/api/users` (rate limiting check)
- API-B: `http://<vuln-alb-dns>/b/api/security` (security headers check)
- API-B: `http://<vuln-alb-dns>/b/api/data` (sensitive data exposure check)
