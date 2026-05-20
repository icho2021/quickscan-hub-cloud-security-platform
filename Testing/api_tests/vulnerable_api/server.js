// ============================================
// VULNERABLE TEST TARGET API
// Intentionally vulnerable API for scanner testing
// DO NOT use this code in production!
// ============================================

import express from "express";

const app = express();
const PORT = Number.parseInt(process.env.PORT || "4000", 10);

app.use(express.json());

// Fake database
const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin", email: "admin@test.com" },
  { id: 2, username: "user1", password: "password123", role: "user", email: "user1@test.com" },
  { id: 3, username: "user2", password: "secret456", role: "user", email: "user2@test.com" },
];

const vulnRouter = express.Router();

// VULNERABILITY 1: No authentication on sensitive endpoint
vulnRouter.get("/api/users", (req, res) => {
  res.json(users);
});

// VULNERABILITY 2: SQL Injection simulation
vulnRouter.get("/api/user", (req, res) => {
  const { id } = req.query;

  // Simulating SQL injection vulnerability
  if (typeof id === "string" && id.includes("'")) {
    return res.status(500).json({
      error: "SQL syntax error",
      message: `Error in SQL query: SELECT * FROM users WHERE id = '${id}'`,
      stack: "at Query.execute (/app/node_modules/mysql/lib/query.js:45:12)",
    });
  }

  const user = users.find((u) => u.id === Number.parseInt(String(id), 10));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// VULNERABILITY 3: NoSQL Injection simulation
vulnRouter.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  // Simulating NoSQL injection - if password is an object, bypass auth
  if (typeof password === "object" && password !== null) {
    return res.json({
      success: true,
      message: "Login successful (NoSQL injection worked)",
      users: users,
    });
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { id: user.id, username: user.username } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// VULNERABILITY 4: No rate limiting
vulnRouter.post("/api/auth", (req, res) => {
  const { username, password } = req.body || {};

  // No rate limiting - allows brute force attacks
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, token: "fake-jwt-token" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// VULNERABILITY 5: Missing security headers (Express default)
vulnRouter.get("/api/data", (req, res) => {
  res.json({
    data: "Some sensitive data",
    apiKey: "sk-live-demo-key-1234567890abcdef",
    dbConnection: "mongodb://admin:password@192.168.1.100:27017/db",
  });
});

// VULNERABILITY 6: Sensitive data in error messages
vulnRouter.post("/api/process", (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Invalid data");
    }

    res.json({ success: true });
  } catch (error) {
    // Exposing sensitive information in error response
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        env: process.env.NODE_ENV || "development",
      },
      database: {
        host: "192.168.1.100",
        password: "db_password_123",
      },
    });
  }
});

// Mount vulnerable routes under /vuln
app.use("/vuln", vulnRouter);

// Also expose the original routes under /api/* (so your tests can use /api/... paths)
app.use(vulnRouter);

// Health checks (ALB uses /vuln-health)
app.get("/vuln-health", (req, res) => {
  res.json({ status: "running", message: "Vulnerable test target is running" });
});

// Optional root health (useful for local testing)
app.get("/health", (req, res) => {
  res.json({ status: "running", message: "Vulnerable test target is running" });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     VULNERABLE TEST TARGET API            ║
  ║     Running on port ${PORT}               ║
  ║     DO NOT USE IN PRODUCTION!            ║
  ╚═══════════════════════════════════════════╝

  Endpoints (mounted under /vuln):
  - GET  /vuln/api/users
  - GET  /vuln/api/user?id=
  - POST /vuln/api/login
  - POST /vuln/api/auth
  - GET  /vuln/api/data
  - POST /vuln/api/process

  Health:
  - GET /vuln-health
  - GET /health
  `);
});

