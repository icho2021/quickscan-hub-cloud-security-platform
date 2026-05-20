import express from "express";

const app = express();
const PORT = Number.parseInt(process.env.PORT || "4000", 10);
const API_PREFIX = process.env.API_PREFIX || "/a";

app.use(express.json());

const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin", email: "admin@test.com" },
  { id: 2, username: "user1", password: "password123", role: "user", email: "user1@test.com" },
  { id: 3, username: "user2", password: "secret456", role: "user", email: "user2@test.com" }
];

const router = express.Router();

// A-1: Missing auth
router.get("/api/users", (req, res) => {
  res.json(users);
});

// A-2: SQL injection simulation
router.get("/api/user", (req, res) => {
  const { id } = req.query;
  if (typeof id === "string" && id.includes("'")) {
    return res.status(500).json({
      error: "SQL syntax error",
      message: `Error in SQL query: SELECT * FROM users WHERE id = '${id}'`,
      stack: "at Query.execute (/app/node_modules/mysql/lib/query.js:45:12)"
    });
  }

  const user = users.find((u) => u.id === Number.parseInt(String(id), 10));
  if (user) {
    return res.json(user);
  }

  return res.status(404).json({ error: "User not found" });
});

// A-3: NoSQL injection simulation
router.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (typeof password === "object" && password !== null) {
    return res.json({
      success: true,
      message: "Login successful (NoSQL injection worked)",
      users
    });
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    return res.json({ success: true, user: { id: user.id, username: user.username } });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Safe fallback endpoints for tests not owned by this API
router.post("/api/auth", (req, res) => {
  res.status(429).json({ error: "Too many requests", message: "Use API-B for rate-limit test" });
});

router.get("/api/data", (req, res) => {
  res.json({ message: "No sensitive data exposed in API-A" });
});

router.post("/api/process", (req, res) => {
  res.status(400).json({ error: "Invalid input" });
});

app.use(router);
app.use(API_PREFIX, router);

app.get("/vuln-health", (req, res) => {
  res.json({ status: "running", api: "auth-injection", prefix: API_PREFIX });
});

app.get(`${API_PREFIX}/vuln-health`, (req, res) => {
  res.json({ status: "running", api: "auth-injection", prefix: API_PREFIX });
});

app.listen(PORT, () => {
  console.log(`API-A running on port ${PORT}, prefix ${API_PREFIX}`);
});
