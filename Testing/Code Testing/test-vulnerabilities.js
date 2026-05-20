/**
 * SAST Test File - Contains 11 Different Types of JavaScript Vulnerabilities
 * This file is designed to be analyzed by the QuickScan Hub SAST Scanner
 * Each code block demonstrates a unique security vulnerability
 */

// ============================================================================
// 1. HARDCODED_SECRET - Hardcoded API Keys and Secrets
// ============================================================================
const apiConfig = {
  // Hardcoded API key
  apiKey: 'sk-live-abcdefghijklmnopqrstuvwx12',
  
  // Hardcoded password
  password: 'MySecretPassword123',
  
  // Hardcoded AWS credentials
  aws_access_key_id: 'AKIAIOSFODNN7EXAMPLE',
  aws_secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  
  // Hardcoded GitHub token
  github_token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
  
  // Hardcoded secret key
  secret_key: 'my_super_secret_key_12345678901234567890'
};

// ============================================================================
// 2. NOSQL_INJECTION - MongoDB Query Injection
// ============================================================================
app.post('/user/find', (req, res) => {
  // VULNERABLE: Direct user input in MongoDB find()
  db.collection('users').find(req.body).toArray((err, results) => {
    if (err) res.status(500).send(err);
    res.json(results);
  });
});

app.get('/api/search', (req, res) => {
  // VULNERABLE: Direct user input in findOne query
  let query = { username: req.query.user };
  db.collection('users').findOne(query, (err, user) => {
    res.json(user);
  });
});

app.put('/update', (req, res) => {
  // VULNERABLE: User input directly in MongoDB updateOne
  db.collection('products').updateOne({ id: req.body.id }, req.body.update);
});

// ============================================================================
// 3. XSS - Cross-Site Scripting
// ============================================================================
function displayUserComment(userInput) {
  // VULNERABLE: Direct innerHTML assignment with user input
  document.getElementById('comments').innerHTML = userInput;
  
  // VULNERABLE: outerHTML assignment
  document.getElementById('content').outerHTML = userInput;
  
  // VULNERABLE: insertAdjacentHTML with unsanitized content
  document.getElementById('sidebar').insertAdjacentHTML('beforeend', userInput);
  
  // VULNERABLE: document.write with user data
  document.write('<div>' + userInput + '</div>');
}

// React example
function UserProfile({ userData }) {
  // VULNERABLE: React dangerouslySetInnerHTML
  return (
    <div dangerouslySetInnerHTML={{ __html: userData.bio }} />
  );
}

// ============================================================================
// 4. PATH_TRAVERSAL - Directory Traversal Vulnerabilities
// ============================================================================
app.get('/download/:filename', (req, res) => {
  // VULNERABLE: Direct user input in fs.readFile
  fs.readFile(req.params.filename, (err, data) => {
    if (err) res.status(404).send('Not found');
    res.send(data);
  });
});

app.post('/upload', (req, res) => {
  // VULNERABLE: User input concatenated in file path
  const filePath = '/uploads/' + req.body.fileName;
  fs.writeFile(filePath, req.body.content, (err) => {
    if (err) res.status(500).send(err);
    res.send('File uploaded');
  });
});

app.delete('/file/:path', (req, res) => {
  // VULNERABLE: User input in unlink operation
  fs.unlinkSync(req.params.path);
});

// ============================================================================
// 5. INSECURE_RANDOM - Cryptographically Weak Random Number Generation
// ============================================================================
function generateSessionToken() {
  // VULNERABLE: Math.random() is not cryptographically secure
  return Math.random().toString(36).substring(2, 15);
}

function generateOTP() {
  // VULNERABLE: Math.random() used for security-sensitive value
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

function generateAuthToken() {
  // VULNERABLE: Math.random() for authentication token
  return 'token_' + Math.random().toString(36).substr(2);
}

// ============================================================================
// 6. SENSITIVE_DATA_LOG - Logging Sensitive Information
// ============================================================================
function handleLogin(username, password) {
  // VULNERABLE: Logging password
  console.log('User attempting login:', username, password);
  
  // VULNERABLE: Logging credit card
  console.info('Transaction details:', {
    amount: 100,
    creditcard: req.body.creditcard
  });
}

function authenticateUser(user) {
  // VULNERABLE: Logging secret token
  console.debug('Auth token:', user.secret_token);
  
  // VULNERABLE: Logging SSN
  console.warn('Customer SSN:', user.social_security_number);
}

// ============================================================================
// 7. SQL_INJECTION - SQL Query Injection
// ============================================================================
app.get('/users/:id', (req, res) => {
  // VULNERABLE: String concatenation in SELECT query
  const query = "SELECT * FROM users WHERE id = '" + req.params.id + "'";
  db.query(query, (err, results) => {
    res.json(results);
  });
});

app.post('/create-user', (req, res) => {
  // VULNERABLE: Template literal in SQL execute
  const sql = `INSERT INTO users (name, email) VALUES ('${req.body.name}', '${req.body.email}')`;
  db.execute(sql);
});

function updateUserRecord(userId, newData) {
  // VULNERABLE: String concatenation in UPDATE query
  const updateQuery = "UPDATE users SET name = '" + newData.name + "' WHERE id = " + userId;
  db.query(updateQuery);
}

// ============================================================================
// 8. HARDCODED_IP - Hardcoded IP Address
// ============================================================================
const connectionConfig = {
  // VULNERABLE: Hardcoded IPv4 address
  dbHost: '192.168.1.100',
  
  // VULNERABLE: Hardcoded IP with port
  apiServer: '10.0.0.50:3000',
  
  // VULNERABLE: Another hardcoded IP
  backupServer: '172.16.0.1',
  
  // VULNERABLE: Production server IP hardcoded
  productionDb: '203.0.113.42'
};

function connectToRemoteService() {
  // VULNERABLE: Hardcoded IP address in connection string
  return http.request('http://10.20.30.40:8080/api');
}

// ============================================================================
// 9. INSECURE_FUNCTION - Dangerous Function Usage
// ============================================================================
function executeUserCode(code) {
  // VULNERABLE: Usage of eval()
  eval(code);
}

function runCommandFromUser(cmd) {
  // VULNERABLE: Usage of exec()
  const result = exec(cmd);
  return result;
}

function processData(scriptString) {
  // VULNERABLE: new Function() to create code
  const fn = new Function(scriptString);
  return fn();
}

const { spawn } = require('child_process');

app.post('/command', (req, res) => {
  // VULNERABLE: child_process exec with user input
  spawn('bash', ['-c', req.body.command]);
});

// ============================================================================
// 10. SECURITY_TODO - Security-Related Comments
// ============================================================================
// TODO: security - This authentication logic needs to be reviewed
function authenticateUser(username, password) {
  // For now, just check if password exists
  return password !== null;
}

// FIXME: vulnerability here - we need to sanitize user input
function renderUserBio(bio) {
  return '<p>' + bio + '</p>';
}

// HACK: This is a quick fix but we need proper validation
// XXX: Security issue - need to implement proper error handling
function handleFileUpload(file) {
  return fs.writeFileSync('/uploads/' + file.name, file.data);
}

/*
  TODO: SECURITY - Implement proper CSRF token validation
  This endpoint is currently vulnerable to CSRF attacks
  Need to add token validation middleware
*/
app.post('/api/sensitive-action', (req, res) => {
  // Process sensitive action
});

// ============================================================================
// 11. WEAK_CRYPTO - Weak Cryptographic Algorithms
// ============================================================================
const crypto = require('crypto');

function hashPassword(password) {
  // VULNERABLE: MD5 hash usage (cryptographically broken)
  return crypto.createHash('md5').update(password).digest('hex');
}

function hashUserData(data) {
  // VULNERABLE: SHA1 hash usage (deprecated, collisions found)
  return crypto.createHash('sha1').update(data).digest('hex');
}

function encryptData(data, key) {
  // VULNERABLE: Deprecated createCipher (uses weak key derivation)
  const cipher = crypto.createCipher('aes-256-cbc', key);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

function decryptData(encrypted, key) {
  // VULNERABLE: Deprecated createDecipher
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

// ============================================================================
// Summary: This test file contains the following vulnerabilities:
// 1. HARDCODED_SECRET (API keys, passwords, tokens)
// 2. NOSQL_INJECTION (MongoDB query injection)
// 3. XSS (Cross-site scripting)
// 4. PATH_TRAVERSAL (Directory traversal)
// 5. INSECURE_RANDOM (Weak randomness)
// 6. SENSITIVE_DATA_LOG (Logging sensitive data)
// 7. SQL_INJECTION (SQL query injection)
// 8. HARDCODED_IP (Hardcoded IP addresses)
// 9. INSECURE_FUNCTION (eval, exec, etc.)
// 10. SECURITY_TODO (Security-related TODOs/FIXMEs)
// 11. WEAK_CRYPTO (MD5, SHA1, weak encryption)
// ============================================================================
