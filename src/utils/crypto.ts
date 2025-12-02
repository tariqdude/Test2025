/**
 * Cryptography and Hashing Utilities
 * Secure, browser-compatible crypto functions
 */

/**
 * Check if Web Crypto API is available
 */
export const hasCrypto = typeof crypto !== 'undefined' && !!crypto.subtle;

/**
 * Generate a UUID v4
 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short unique ID
 */
export function shortId(length = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);

  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

/**
 * Generate a nanoid-style ID
 */
export function nanoId(size = 21): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = new Uint8Array(size);

  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] & 63];
  }
  return id;
}

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert string to bytes (UTF-8)
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert bytes to string (UTF-8)
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert bytes to base64
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    return btoa(String.fromCharCode(...bytes));
  }
  // Node.js fallback
  return Buffer.from(bytes).toString('base64');
}

/**
 * Convert base64 to bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Base64 URL-safe encoding
 */
export function base64UrlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? stringToBytes(data) : data;
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64 URL-safe decoding
 */
export function base64UrlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }

  return bytesToString(base64ToBytes(base64));
}

/**
 * Hash algorithms available in Web Crypto API
 */
export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Hash data using Web Crypto API
 */
export async function hash(
  data: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<string> {
  if (!hasCrypto) {
    throw new Error('Web Crypto API not available');
  }

  const bytes = typeof data === 'string' ? stringToBytes(data) : data;
  const hashBuffer = await crypto.subtle.digest(
    algorithm,
    bytes.buffer as ArrayBuffer
  );
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * SHA-256 hash
 */
export async function sha256(data: string | Uint8Array): Promise<string> {
  return hash(data, 'SHA-256');
}

/**
 * SHA-512 hash
 */
export async function sha512(data: string | Uint8Array): Promise<string> {
  return hash(data, 'SHA-512');
}

/**
 * Simple hash for non-cryptographic purposes (fast)
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * DJB2 hash algorithm
 */
export function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned
}

/**
 * FNV-1a hash algorithm
 */
export function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

/**
 * HMAC signing using Web Crypto
 */
export async function hmacSign(
  message: string | Uint8Array,
  secret: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<string> {
  if (!hasCrypto) {
    throw new Error('Web Crypto API not available');
  }

  const secretBytes =
    typeof secret === 'string' ? stringToBytes(secret) : secret;
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const messageBytes =
    typeof message === 'string' ? stringToBytes(message) : message;
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    messageBytes.buffer as ArrayBuffer
  );

  return bytesToHex(new Uint8Array(signature));
}

/**
 * HMAC verification
 */
export async function hmacVerify(
  message: string | Uint8Array,
  signature: string,
  secret: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<boolean> {
  const computed = await hmacSign(message, secret, algorithm);
  return timingSafeEqual(computed, signature);
}

/**
 * Timing-safe string comparison (prevents timing attacks)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * AES-GCM encryption
 */
export async function encrypt(
  plaintext: string,
  password: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  if (!hasCrypto) {
    throw new Error('Web Crypto API not available');
  }

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const passwordBytes = stringToBytes(password);
  const plaintextBytes = stringToBytes(plaintext);

  // Derive key from password using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    plaintextBytes.buffer as ArrayBuffer
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
  };
}

/**
 * AES-GCM decryption
 */
export async function decrypt(
  ciphertext: string,
  password: string,
  iv: string,
  salt: string
): Promise<string> {
  if (!hasCrypto) {
    throw new Error('Web Crypto API not available');
  }

  const saltBytes = base64ToBytes(salt);
  const ivBytes = base64ToBytes(iv);
  const ciphertextBytes = base64ToBytes(ciphertext);
  const passwordBytes = stringToBytes(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer },
    key,
    ciphertextBytes.buffer as ArrayBuffer
  );

  return bytesToString(new Uint8Array(plaintext));
}

/**
 * Generate RSA key pair
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  if (!hasCrypto) {
    throw new Error('Web Crypto API not available');
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bytesToBase64(new Uint8Array(publicKey)),
    privateKey: bytesToBase64(new Uint8Array(privateKey)),
  };
}

/**
 * Generate a secure password
 */
export function generatePassword(
  length = 16,
  options: {
    lowercase?: boolean;
    uppercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
    excludeSimilar?: boolean;
    excludeAmbiguous?: boolean;
  } = {}
): string {
  const {
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = true,
    excludeSimilar = false,
    excludeAmbiguous = false,
  } = options;

  let chars = '';

  const lowercaseChars = excludeSimilar
    ? 'abcdefghjkmnpqrstuvwxyz'
    : 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = excludeSimilar
    ? 'ABCDEFGHJKMNPQRSTUVWXYZ'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = excludeSimilar ? '23456789' : '0123456789';
  const symbolChars = excludeAmbiguous
    ? '!@#$%^&*'
    : '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (lowercase) chars += lowercaseChars;
  if (uppercase) chars += uppercaseChars;
  if (numbers) chars += numberChars;
  if (symbols) chars += symbolChars;

  if (!chars) {
    throw new Error('At least one character type must be enabled');
  }

  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
} {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length < 8) feedback.push('Use at least 8 characters');

  // Character variety
  if (/[a-z]/.test(password)) score += 0.5;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 0.5;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 0.5;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;
  else feedback.push('Add special characters');

  // Common patterns (penalty)
  if (/^[a-z]+$/i.test(password)) {
    score -= 1;
    feedback.push('Avoid using only letters');
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 1;
    feedback.push('Avoid using only numbers');
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }
  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score -= 2;
    feedback.push('Avoid common patterns');
  }

  // Normalize score to 0-4
  score = Math.max(0, Math.min(4, Math.round(score)));

  const strengths: Array<
    'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'
  > = ['very-weak', 'weak', 'fair', 'strong', 'very-strong'];

  return {
    score,
    feedback,
    strength: strengths[score],
  };
}

/**
 * Generate OTP (One-Time Password) secret
 */
export function generateOTPSecret(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

/**
 * Generate TOTP (Time-based One-Time Password)
 */
export async function generateTOTP(
  secret: string,
  options: {
    period?: number;
    digits?: number;
    algorithm?: HashAlgorithm;
    timestamp?: number;
  } = {}
): Promise<string> {
  const {
    period = 30,
    digits = 6,
    algorithm = 'SHA-1',
    timestamp = Date.now(),
  } = options;

  // Decode base32 secret
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const secretUpper = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';

  for (const char of secretUpper) {
    const val = base32Chars.indexOf(char);
    bits += val.toString(2).padStart(5, '0');
  }

  const secretBytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < secretBytes.length; i++) {
    secretBytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  // Calculate counter
  const counter = Math.floor(timestamp / 1000 / period);
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  // HMAC
  const hmac = await hmacSign(counterBytes, secretBytes, algorithm);
  const hmacBytes = hexToBytes(hmac);

  // Dynamic truncation
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const code =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

/**
 * Verify TOTP
 */
export async function verifyTOTP(
  token: string,
  secret: string,
  options: {
    period?: number;
    digits?: number;
    algorithm?: HashAlgorithm;
    window?: number;
  } = {}
): Promise<boolean> {
  const { window = 1, period = 30, ...otpOptions } = options;
  const now = Date.now();

  for (let i = -window; i <= window; i++) {
    const timestamp = now + i * period * 1000;
    const expected = await generateTOTP(secret, {
      ...otpOptions,
      period,
      timestamp,
    });
    if (timingSafeEqual(token, expected)) {
      return true;
    }
  }

  return false;
}

/**
 * Create a checksum for data integrity
 */
export function checksum(data: string): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum = (sum + data.charCodeAt(i) * (i + 1)) % 65521;
  }
  return sum.toString(16).padStart(4, '0');
}

/**
 * CRC32 checksum
 */
export function crc32(data: string): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Simple obfuscation (NOT secure, just for casual hiding)
 */
export function obfuscate(str: string, key = 42): string {
  return Array.from(str)
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ (key + i)))
    .join('');
}

/**
 * Deobfuscate (reverse of obfuscate)
 */
export function deobfuscate(str: string, key = 42): string {
  return obfuscate(str, key); // XOR is symmetric
}

/**
 * Fingerprint generator for browser/device
 */
export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return uuid();
  }

  const components: string[] = [];

  // Screen info
  if (typeof screen !== 'undefined') {
    components.push(`${screen.width}x${screen.height}`);
    components.push(`${screen.colorDepth}`);
  }

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency
  if (navigator.hardwareConcurrency) {
    components.push(String(navigator.hardwareConcurrency));
  }

  // Device memory (if available)
  if ('deviceMemory' in navigator) {
    components.push(
      String((navigator as Navigator & { deviceMemory: number }).deviceMemory)
    );
  }

  // Touch support
  components.push(String('ontouchstart' in window));

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    // Canvas blocked
  }

  const fingerprint = components.join('|');
  return sha256(fingerprint);
}
