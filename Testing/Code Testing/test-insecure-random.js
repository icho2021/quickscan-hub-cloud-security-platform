/**
 * Test Case 5: INSECURE_RANDOM
 * Insecure random number generation examples
 */

// Example 1: Generate session token
function generateSessionToken() {
  // High risk: Math.random() is not cryptographically secure
  return 'session_' + Math.random().toString(36).substring(2, 15);
}

// Example 2: Generate one-time password (OTP)
function generateOTP() {
  // High risk: Insecure random number for authentication purposes
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// Example 3: Generate API key
function generateAPIKey() {
  // High risk: Insecure random number for API authentication
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Example 4: Generate password reset token
function generatePasswordResetToken(userId) {
  // High risk: Insecure token for authentication
  const random = Math.random().toString(36).substr(2);
  return userId + '_' + random + '_' + Date.now();
}

// Example 5: Generate confirmation code
function generateConfirmationCode() {
  // High risk: For email or phone confirmation
  return Math.random().toString().substring(2, 8);
}

// Example 6: Generate encryption key
function generateEncryptionKey() {
  // High risk: Insecure key for data encryption
  return Math.random().toString(16).substring(2) + 
         Math.random().toString(16).substring(2);
}

// Example 7: Generate CSRF token
function generateCSRFToken() {
  // High risk: CSRF protection token uses insecure random number
  const token1 = Math.random();
  const token2 = Math.random();
  return (token1 * token2).toString(36);
}

// Example 8
function generateAccessToken(userId) {
  // High risk: Bearer token
  const random = Math.random().toString(36);
  const timestamp = Date.now().toString(36);
  return 'Bearer_' + userId + '_' + timestamp + '_' + random;
}
