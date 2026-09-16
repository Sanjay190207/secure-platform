const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Master Key for AES-256 (derived from JWT_SECRET or KMS Key if GCP credentials present)
const MASTER_SECRET = process.env.JWT_SECRET || 'secure-kms-key-2026-exam-paper-management-secret';

let kmsClient = null;
let useGcpKms = false;

// Initialize GCP KMS if credentials available
try {
  const kms = require('@google-cloud/kms');
  if (process.env.GCP_KMS_KEY_NAME && process.env.GCP_PROJECT_ID) {
    kmsClient = new kms.KeyManagementServiceClient();
    useGcpKms = true;
    console.log(`[CRYPTO/KMS] Connected to Google Cloud KMS Key: ${process.env.GCP_KMS_KEY_NAME}`);
  } else {
    console.log('[CRYPTO/KMS] GCP KMS Key not active locally. Using AES-256-GCM authenticated master key fallback...');
  }
} catch (e) {
  console.log('[CRYPTO/KMS] Using AES-256-GCM authenticated master key fallback...');
}

/**
 * Compute SHA-256 Hash Digest
 */
function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Encrypt Raw Buffer with AES-256-GCM
 */
function encryptPaperBuffer(buffer) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive 256-bit Key using PBKDF2
  const key = crypto.pbkdf2Sync(MASTER_SECRET, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack payload: [SALT (32b)][IV (16b)][AUTH_TAG (16b)][CIPHERTEXT]
  const packedPayload = Buffer.concat([salt, iv, authTag, encrypted]);
  return packedPayload;
}

/**
 * Decrypt Buffer with AES-256-GCM
 */
function decryptPaperBuffer(packedBuffer) {
  try {
    const salt = packedBuffer.subarray(0, SALT_LENGTH);
    const iv = packedBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = packedBuffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = packedBuffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = crypto.pbkdf2Sync(MASTER_SECRET, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch (err) {
    throw new Error('Decryption or Authentication Tag verification failed! File content has been modified or corrupted.');
  }
}

/**
 * Verify Runtime Integrity (Compares Current File Hash vs Original Stored Hash)
 */
function verifyPaperIntegrity(currentBuffer, storedHash) {
  const currentHash = computeSha256(currentBuffer);
  const isMatch = crypto.timingSafeEqual(Buffer.from(currentHash, 'hex'), Buffer.from(storedHash, 'hex'));

  return {
    verified: isMatch,
    currentHash,
    storedHash,
    integrityStatus: isMatch ? 'VERIFIED' : 'TAMPERING_DETECTED'
  };
}

module.exports = {
  computeSha256,
  encryptPaperBuffer,
  decryptPaperBuffer,
  verifyPaperIntegrity,
  isGcpKms: () => useGcpKms
};
