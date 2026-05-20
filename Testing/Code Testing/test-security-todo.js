/**
 * Test Case 11: SECURITY_TODO
 * Security-related TODO/FIXME comment examples
 */

// Example 1: Basic security TODO
function authenticateUser(username, password) {
  // TODO: security - Need to implement password hashing
  if (username && password) {
    return true;
  }
  return false;
}

// Example 2: FIXME security issue
function validateUserInput(input) {
  // FIXME: vulnerability - Need to sanitize SQL input
  const query = "SELECT * FROM users WHERE id = " + input;
  return query;
}

// Example 3: XXX security issue
app.get('/api/secret', (req, res) => {
  // XXX: Security issue - Remove hardcoded credentials
  const apiKey = 'sk-live-hardcoded-key-demo-1234567890ab';
  res.json({ key: apiKey });
});

// Example 4: HACK comment
function generateToken() {
  // HACK: This is a temporary workaround, fix before production
  // Should use crypto.randomBytes() instead
  return Math.random().toString(36).substring(2);
}

// Example 5
/*
  TODO: SECURITY
  The JWT token validation is not implemented.
  This endpoint is currently accessible without proper authentication.
  Must implement before going to production.
*/
app.post('/api/sensitive', (req, res) => {
  // ... Handle sensitive operations
});

// Example 6
/**
 * TODO: auth - Implement proper CSRF token validation
 * This endpoint is vulnerable to CSRF attacks.
 * Current implementation doesn't validate origin or referrer.
 */
function processSensitiveAction(req) {
  // ... Handle
}

// Example 7
function hashPassword(pwd) {
  // FIXME: security - Using MD5 is insecure, switch to bcrypt
  return crypto.createHash('md5').update(pwd).digest('hex');
}

// Example 8
function validateEmail(email) {
  // XXX: vulnerability - regex is too permissive
  const pattern = /.+@.+/;
  return pattern.test(email);
}

// Example 9
class UserService {
  // TODO: security - Add rate limiting
  // TODO: auth - Implement JWT token expiration
  // FIXME: vulnerability - SQL injection risk in search
  // XXX: Security issue - No input validation
  
  getUserById(id) {
    const query = "SELECT * FROM users WHERE id = " + id;
    return db.query(query);
  }
}

// Example 10
/*
 * SECURITY TODO:
 * This function needs the follow fixes:
 * 1. Add password hashing (bcrypt or scrypt)
 * 2. Implement account lockout after failed attempts
 * 3. Add rate limiting
 * 4. Validate email domain
 * Don't merge to main branch without addressing these!
 */
function registerUser(email, password) {
  // 
}

// Example 11
function setupDatabase() {
  // TODO: security - validate connection credentials
  const conn = mysql.createConnection({
    host: '192.168.1.100',
    user: 'admin',
    password: 'admin123'  // FIXME: hardcoded password
  });
}

// Example 12
function generateRandomId() {
  // HACK: Should be replaced with proper UUID generation
  // Current implementation uses Math.random() which is predictable
  return Math.floor(Math.random() * 1000000);
}
