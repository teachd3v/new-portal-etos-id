/**
 * Pure Web Crypto API implementation of Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID ES256)
 * Compatible with both Node.js 20+ and Cloudflare Workers (@opennextjs/cloudflare) with zero native dependencies.
 */

// Default production-ready VAPID P-256 keypair (can be overridden via env vars VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY)
const DEFAULT_VAPID_PUBLIC_KEY =
  'BKamWtUGEv6EgzBe6ATXZBVy3vm51hUs-J2kGQ6w9bu-4fFr98Qae07dh8k8WwLBrdwZks8SNE6T4a0u0KTUdgU';
const DEFAULT_VAPID_PRIVATE_KEY =
  'I8NRlLx6VYW52k8-Dzqqdxlb-0saNY7ks2PmDQ1xCqk';
const DEFAULT_VAPID_SUBJECT = 'mailto:admin@etos-id.net';

export function getVapidConfig() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    DEFAULT_VAPID_PUBLIC_KEY;
  const privateKey =
    process.env.VAPID_PRIVATE_KEY ||
    DEFAULT_VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT ||
    DEFAULT_VAPID_SUBJECT;

  return { publicKey, privateKey, subject };
}

export function base64UrlToUint8Array(base64UrlString) {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function uint8ArrayToBase64Url(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(u8)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  let binary = '';
  for (let i = 0; i < u8.byteLength; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function concatUint8Arrays(...arrays) {
  const totalLen = arrays.reduce((acc, arr) => acc + arr.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.byteLength;
  }
  return result;
}

async function hkdfDeriveBytes(ikmBytes, saltBytes, infoBytes, byteLength) {
  const { subtle } = globalThis.crypto;
  const baseKey = await subtle.importKey('raw', ikmBytes, 'HKDF', false, ['deriveBits']);
  const derivedBits = await subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBytes,
      info: infoBytes,
    },
    baseKey,
    byteLength * 8
  );
  return new Uint8Array(derivedBits);
}

/**
 * Generates RFC 8292 VAPID Authorization header (`vapid t=<jwt>, k=<publicKey>`)
 */
export async function createVapidAuthorization(endpoint, vapidConfig = getVapidConfig()) {
  const { subtle } = globalThis.crypto;
  const { publicKey, privateKey, subject } = vapidConfig;

  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const pubBytes = base64UrlToUint8Array(publicKey);
  if (pubBytes.byteLength !== 65 || pubBytes[0] !== 0x04) {
    throw new Error('Invalid VAPID public key: expected 65-byte uncompressed P-256 point');
  }

  const x = uint8ArrayToBase64Url(pubBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(pubBytes.slice(33, 65));

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d: privateKey,
    ext: true,
  };

  const signingKey = await subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(
    encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  );
  const payloadB64 = uint8ArrayToBase64Url(
    encoder.encode(JSON.stringify({ aud: audience, exp, sub: subject }))
  );

  const unsignedToken = `${headerB64}.${payloadB64}`;
  const signatureBuffer = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    encoder.encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${uint8ArrayToBase64Url(new Uint8Array(signatureBuffer))}`;
  return `vapid t=${jwt}, k=${publicKey}`;
}

/**
 * Encrypts a string/JSON payload according to RFC 8291 (aes128gcm)
 */
export async function encryptWebPushPayload(payloadText, p256dhBase64Url, authBase64Url) {
  const { subtle } = globalThis.crypto;
  const encoder = new TextEncoder();

  const uaPublicBytes = base64UrlToUint8Array(p256dhBase64Url);
  const authSecretBytes = base64UrlToUint8Array(authBase64Url);

  // 1. Import subscriber's P-256 ECDH public key
  const uaPublicKey = await subtle.importKey(
    'raw',
    uaPublicBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // 2. Generate ephemeral Application Server ECDH P-256 keypair
  const asKeyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const asPublicBytes = new Uint8Array(await subtle.exportKey('raw', asKeyPair.publicKey));

  // 3. Compute 32-byte ECDH shared secret
  const ecdhSecretBuffer = await subtle.deriveBits(
    { name: 'ECDH', public: uaPublicKey },
    asKeyPair.privateKey,
    256
  );
  const ecdhSecret = new Uint8Array(ecdhSecretBuffer);

  // 4. HKDF step 1: combine ECDH shared secret and subscriber auth secret -> 32-byte IKM
  const keyInfo = concatUint8Arrays(
    encoder.encode('WebPush: info\0'),
    uaPublicBytes,
    asPublicBytes
  );
  const ikm = await hkdfDeriveBytes(ecdhSecret, authSecretBytes, keyInfo, 32);

  // 5. Generate 16-byte random salt
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));

  // 6. HKDF step 2: derive 16-byte CEK and 12-byte NONCE
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  const cekBytes = await hkdfDeriveBytes(ikm, salt, cekInfo, 16);
  const nonceBytes = await hkdfDeriveBytes(ikm, salt, nonceInfo, 12);

  // 7. AES-128-GCM encrypt (plaintext + 0x02 final record delimiter)
  const plaintextBytes = encoder.encode(payloadText);
  const paddedPlaintext = concatUint8Arrays(plaintextBytes, new Uint8Array([0x02]));

  const cekKey = await subtle.importKey('raw', cekBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBytes, tagLength: 128 },
    cekKey,
    paddedPlaintext
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  // 8. Build RFC 8188 aes128gcm header: salt(16) || rs(4: 4096) || idlen(1: 65) || keyid(65) || ciphertext
  const rsBytes = new Uint8Array([0x00, 0x00, 0x10, 0x00]); // 4096
  const idLenByte = new Uint8Array([asPublicBytes.byteLength]); // 65

  return concatUint8Arrays(salt, rsBytes, idLenByte, asPublicBytes, ciphertext);
}

/**
 * Sends a Web Push notification to a single subscription object
 * @param {{ endpoint: string, p256dh: string, auth: string }} subscription
 * @param {object|string} payloadData
 * @returns {Promise<{ ok: boolean, status: number, expired: boolean, error?: string }>}
 */
export async function sendWebPushNotification(subscription, payloadData) {
  try {
    const payloadString =
      typeof payloadData === 'string' ? payloadData : JSON.stringify(payloadData);

    const vapidAuth = await createVapidAuthorization(subscription.endpoint);
    const encryptedBody = await encryptWebPushPayload(
      payloadString,
      subscription.p256dh,
      subscription.auth
    );

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidAuth,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(encryptedBody.byteLength),
        TTL: '86400',
        Urgency: 'high',
      },
      body: encryptedBody,
    });

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, status: response.status, expired: false };
    }

    // 404 or 410 means the push subscription is no longer valid / expired and should be removed from DB
    const expired = response.status === 404 || response.status === 410;
    const errText = await response.text().catch(() => '');
    return {
      ok: false,
      status: response.status,
      expired,
      error: errText || `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      expired: false,
      error: err?.message || 'Push dispatch failed',
    };
  }
}
