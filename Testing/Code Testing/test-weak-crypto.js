/**
 * Test Case 10: WEAK_CRYPTO
 * Weak encryption algorithm examples
 */

const crypto = require('crypto');

// Example 1: MD5 hash (broken)
function hashPasswordWithMD5(password) {
  // High risk: MD5 is considered cryptographically broken
  return crypto.createHash('md5').update(password).digest('hex');
}

// Example 2: SHA1 hash (deprecated)
function generateSHA1Hash(data) {
  // High risk: SHA1 collision found, not secure
  const hash = crypto.createHash('sha1').update(data).digest('hex');
  return hash;
}

// Example 3: MD5 in file verification
function verifyFileIntegrity(file, expectedMD5) {
  // High risk: File verification with MD5 can be forged
  const hash = crypto.createHash('md5').update(file).digest('hex');
  return hash === expectedMD5;
}

// Example 4: Deprecated createCipher
function encryptDataUnsafe(data, password) {
  // Extremely high risk: createCipher uses weak key derivation (EVP_BytesToKey)
  const cipher = crypto.createCipher('aes-256-cbc', password);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Example 5: Deprecated createDecipher
function decryptDataUnsafe(encrypted, password) {
  // Extremely high risk: createDecipher corresponds to createCipher
  const decipher = crypto.createDecipher('aes-256-cbc', password);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Example 6: SHA1 for security token
function generateSecurityToken(userId) {
  // High risk: Security token uses SHA1
  const data = userId + Date.now();
  const token = crypto.createHash('sha1').update(data).digest('hex');
  return token;
}

// Example 7: MD5 for key derivation
function deriveKeyWithMD5(masterKey) {
  // High risk: Key derived from master key uses MD5
  const key = crypto.createHash('md5').update(masterKey).digest();
  return key;
}

// Example 8: Weak algorithm in integrity verification
class FileVerifier {
  constructor(filePath) {
    this.filePath = filePath;
  }
  
  // High risk: Use MD5 for integrity check
  getChecksum() {
    const data = require('fs').readFileSync(this.filePath);
    return crypto.createHash('md5').update(data).digest('hex');
  }
}

// Example 9: Multiple weak encryption combinations
function legacyEncryption(plaintext, key) {
  // High risk: Multiple weak points combined
  // 1. Derive key using MD5
  const derivedKey = crypto.createHash('md5').update(key).digest();
  
  // 2. Use deprecated encryption function
  const cipher = crypto.createCipher('des', derivedKey);
  const encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
  
  // 3. SHA1 as HMAC
  const hmac = crypto.createHmac('sha1', key).update(encrypted).digest('hex');
  
  return encrypted + ':' + hmac;
}

// Example 10
function chainHash(data) {
  // High risk
  let result = data;
  for (let i = 0; i < 100; i++) {
    // MD5 multiple times
    result = crypto.createHash('md5').update(result).digest('hex');
  }
  return result;
}
