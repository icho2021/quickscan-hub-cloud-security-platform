import express from "express";

const app = express();
const PORT = Number.parseInt(process.env.PORT || "4000", 10);
const API_PREFIX = process.env.API_PREFIX || "/b";

app.use(express.json());

const router = express.Router();

// B-1: No rate limiting
router.post("/api/auth", (req, res) => {
  const { username, password } = req.body || {};
  if (username === "admin" && password === "admin123") {
    return res.json({ success: true, token: "fake-jwt-token" });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.get("/api/users", (req, res) => {
  res.json([
    { id: 1, username: "admin" },
    { id: 2, username: "user1" }
  ]);
});

// B-2: Missing security headers (Express default + x-powered-by)
router.get("/api/security", (req, res) => {
  res.json({ message: "Headers intentionally weak for testing" });
});

// B-3: Sensitive data exposure
router.get("/api/data", (req, res) => {
  res.json({
    data: "Some sensitive data",
    apiKey: "sk-live-demo-key-1234567890abcdef",
    dbConnection: "mongodb://admin:password@192.168.1.100:27017/db"
  });
});

router.post("/api/process", (req, res) => {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Invalid data");
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform
      },
      database: {
        host: "192.168.1.100",
        password: "db_password_123"
      }
    });
  }
});

// Neutral responses for tests owned by API-A
router.get("/api/user", (req, res) => {
  res.status(404).json({ error: "Not implemented in API-B" });
});

router.post("/api/login", (req, res) => {
  res.status(401).json({ error: "Invalid credentials" });
});

app.use(router);
app.use(API_PREFIX, router);

// Handle invalid JSON parse errors with intentionally verbose output.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(500).json({
      error: "Invalid JSON payload",
      stack: err.stack,
      apiKey: "sk_test_invalid_json_handler",
      dbConnection: "mongodb://admin:password@192.168.1.100:27017/db"
    });
  }
  return next(err);
});

app.get("/vuln-health", (req, res) => {
  res.json({ status: "running", api: "config-exposure", prefix: API_PREFIX });
});

app.get(`${API_PREFIX}/vuln-health`, (req, res) => {
  res.json({ status: "running", api: "config-exposure", prefix: API_PREFIX });
});

app.listen(PORT, () => {
  console.log(`API-B running on port ${PORT}, prefix ${API_PREFIX}`);
});
