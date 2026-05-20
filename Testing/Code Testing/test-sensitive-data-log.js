/**
 * Test Case 8: SENSITIVE_DATA_LOG
 * Sensitive data logging examples
 */

// Example 1: Log password
function handleLogin(username, password) {
  console.log('Login attempt - Username: ' + username + ', Password: ' + password);
  // ... Continue handling login
}

// Example 2: Log API key
function configureAPI(apiKey, apiSecret) {
  console.info('API Configured - Key: ' + apiKey + ', Secret: ' + apiSecret);
}

// Example 3: Log credit card information
function processPayment(cardData) {
  const logData = {
    amount: cardData.amount,
    creditCard: cardData.cc,
    cvv: cardData.cvv,
    expiryDate: cardData.expiry
  };
  console.debug('Processing payment:', logData);
}

// Example 4: Log token information
function authenticateUser(user) {
  console.error('User authentication - Token: ' + user.accessToken);
  console.warn('Guard token: ' + user.guardToken);
}

// Example 5: Log secrets in trace information
function traceRequest(req) {
  const traceData = {
    path: req.path,
    method: req.method,
    apiKey: req.headers['api-key'],
    bearerToken: req.headers['authorization']
  };
  console.log('Request trace:', traceData);
}

// Example 6: Log sensitive data in exception handling
function validateCredentials(creds) {
  try {
    // ... Validation logic
  } catch (err) {
    console.error('Auth validation failed:', {
      username: creds.username,
      password: creds.password,
      secret: creds.secret
    });
  }
}

// Example 7: Database connection information
function connectToDatabase(config) {
  console.info('Connecting to database:', {
    host: config.host,
    port: config.port,
    username: config.user,
    password: config.password
  });
}

// Example 8: Log SSN and other personal information
function logCustomer(customer) {
  const info = {
    name: customer.name,
    email: customer.email,
    social_security_number: customer.ssn,
    creditCard: customer.cc
  };
  console.log('Customer info:', info);
}

// Example 9: Sensitive data in multi-line logs
function processUserData(userData) {
  console.log('=== User Processing Started ===');
  console.log('User ID: ' + userData.id);
  console.log('User Secret: ' + userData.secret);
  console.log('Access Key: ' + userData.key);
  console.log('=== User Processing Ended ===');
}

// Example 10: Debug logs
function debugAPI(request) {
  console.debug('Full request object:', request);
  // Contains all sensitive information
}
