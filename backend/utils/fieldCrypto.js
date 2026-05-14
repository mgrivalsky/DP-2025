const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

let warnedAboutDevFallback = false;

function isProd() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function getKey() {
  const raw = String(process.env.DATA_ENCRYPTION_KEY || '').trim();

  if (!raw) {
    if (!warnedAboutDevFallback) {
      console.warn('[crypto] DATA_ENCRYPTION_KEY is not set. Using a dev-only fallback key.');
      warnedAboutDevFallback = true;
    }
    return crypto.createHash('sha256').update('dev-only-encryption-key-change-me', 'utf8').digest();
  }

  // Preferred format: base64-encoded 32-byte key.
  try {
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length === 32) return decoded;
  } catch {
    // ignore and fall back to hash derivation
  }

  // Backward-compatible fallback: derive key from provided string.
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

function looksEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptText(value) {
  if (value === null || typeof value === 'undefined') return null;

  const text = String(value);
  if (!text) return text;
  if (looksEncrypted(text)) return text;

  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const packed = `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
  return `${PREFIX}${packed}`;
}

function decryptText(value) {
  if (value === null || typeof value === 'undefined') return value;
  if (typeof value !== 'string') return value;
  if (!looksEncrypted(value)) return value;

  const raw = value.slice(PREFIX.length);
  const parts = raw.split('.');
  if (parts.length !== 3) return value;

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch {
    // Keep original value to avoid breaking responses if key changes.
    return value;
  }
}

function decryptFields(row, fields) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const field of fields || []) {
    if (Object.prototype.hasOwnProperty.call(out, field)) {
      out[field] = decryptText(out[field]);
    }
  }
  return out;
}

function ensureCryptoEnv() {
  const raw = String(process.env.DATA_ENCRYPTION_KEY || '').trim();
  if (isProd() && !raw) {
    console.warn('[crypto] DATA_ENCRYPTION_KEY is not set in production. Encryption uses fallback key; set DATA_ENCRYPTION_KEY immediately.');
  }
}

module.exports = {
  encryptText,
  decryptText,
  decryptFields,
  ensureCryptoEnv
};
