import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'portal-etos-id-secure-jwt-secret-key-change-in-production'
);

/**
 * Sign payload to JWT
 */
export async function signJwt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token
 */
export async function verifyJwt(token) {
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password using Web Crypto PBKDF2 (Native, Edge-compatible, zero external native deps)
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const iterations = 100000;
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify password against hash (with backward compatibility for plaintext)
 * Returns { valid: boolean, needsUpgrade: boolean }
 */
export async function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword || !inputPassword) {
    return { valid: false, needsUpgrade: false };
  }

  if (storedPassword.startsWith('pbkdf2:')) {
    const parts = storedPassword.split(':');
    if (parts.length !== 4) return { valid: false, needsUpgrade: false };

    const [, iterStr, saltHex, originalHashHex] = parts;
    const iterations = parseInt(iterStr, 10);
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(inputPassword),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const derivedHashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const valid = timingSafeEqual(derivedHashHex, originalHashHex);
    return { valid, needsUpgrade: false };
  }

  // Legacy fallback: direct plaintext check
  const isPlainMatch = inputPassword === storedPassword;
  return { valid: isPlainMatch, needsUpgrade: isPlainMatch };
}

/**
 * Extract auth user from Request object (Cookies or Bearer Authorization header)
 */
export async function getAuthUser(request) {
  let token = request.cookies?.get?.('auth_token')?.value;

  if (!token && request.headers) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  return await verifyJwt(token);
}

