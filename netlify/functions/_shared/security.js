const crypto = require('crypto');

const COOKIE_NAME = 'wearguard_session';
const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function json(statusCode, body, headers) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(headers || {}),
    },
    body: JSON.stringify(body),
  };
}

function methodNotAllowed(allow) {
  return json(405, { ok: false, error: 'Method not allowed.' }, {
    Allow: allow.join(', '),
  });
}

function getEnv(name) {
  return typeof process.env[name] === 'string' ? process.env[name].trim() : '';
}

function getRequiredEnv(name) {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function getSessionSecret() {
  return getRequiredEnv('WEARGUARD_SESSION_SECRET');
}

function getAccessCode() {
  return getRequiredEnv('WEARGUARD_ACCESS_CODE');
}

function getStorageSecret() {
  return getEnv('WEARGUARD_STORAGE_SECRET') || getSessionSecret();
}

function getWebhookSigningSecret() {
  return getEnv('WEARGUARD_WEBHOOK_SIGNING_SECRET') || getSessionSecret();
}

function createSignature(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function encodeToken(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeToken(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || '')
    .split(/;\s*/)
    .reduce((acc, pair) => {
      const separator = pair.indexOf('=');
      if (separator === -1) return acc;

      const key = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (key) acc[key] = value;
      return acc;
    }, {});
}

function validateProfile(value) {
  if (!value || typeof value !== 'object') return null;

  const name = String(value.name || '').trim();
  const email = String(value.email || '').trim().toLowerCase();

  if (!name) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return { name, email };
}

function isAllowedEmail(email) {
  const allowList = getEnv('WEARGUARD_ALLOWED_EMAILS');
  const allowedDomain = getEnv('WEARGUARD_ALLOWED_DOMAIN').toLowerCase();

  if (allowList) {
    const allowedEmails = allowList
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(email.toLowerCase())) {
      return false;
    }
  }

  if (allowedDomain) {
    const emailDomain = email.split('@')[1] || '';
    if (emailDomain.toLowerCase() !== allowedDomain) {
      return false;
    }
  }

  return true;
}

function createStorageKey(email) {
  return createSignature(`${email.toLowerCase()}:storage`, getStorageSecret());
}

function createSessionCookie(profile, remember) {
  const now = Date.now();
  const ttl = (remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS) * 1000;
  const payload = {
    name: profile.name,
    email: profile.email,
    remembered: Boolean(remember),
    iat: now,
    exp: now + ttl,
  };

  const encoded = encodeToken(payload);
  const signature = createSignature(encoded, getSessionSecret());
  const cookie = [
    `${COOKIE_NAME}=${encoded}.${signature}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ];

  if (remember) {
    cookie.push(`Max-Age=${REMEMBER_TTL_SECONDS}`);
  }

  return cookie.join('; ');
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readSessionFromEvent(event) {
  const cookieHeader = event && event.headers
    ? event.headers.cookie || event.headers.Cookie
    : '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expectedSignature = createSignature(encoded, getSessionSecret());
  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const payload = decodeToken(encoded);
    if (!payload || payload.exp <= Date.now()) return null;

    return validateProfile(payload)
      ? {
          name: String(payload.name).trim(),
          email: String(payload.email).trim().toLowerCase(),
          remembered: Boolean(payload.remembered),
          iat: payload.iat,
          exp: payload.exp,
        }
      : null;
  } catch (error) {
    return null;
  }
}

function createSessionPayload(session) {
  return {
    ok: true,
    authenticated: true,
    profile: {
      name: session.name,
      email: session.email,
    },
    remembered: Boolean(session.remembered),
    storageKey: createStorageKey(session.email),
  };
}

function unauthorized() {
  return json(401, { ok: false, error: 'Secure session expired or missing.' }, {
    'Set-Cookie': clearSessionCookie(),
  });
}

function readJsonBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (error) {
    return null;
  }
}

module.exports = {
  clearSessionCookie,
  constantTimeEqual,
  createSessionCookie,
  createSessionPayload,
  getAccessCode,
  getEnv,
  getRequiredEnv,
  getSessionSecret,
  getWebhookSigningSecret,
  isAllowedEmail,
  json,
  methodNotAllowed,
  readJsonBody,
  readSessionFromEvent,
  unauthorized,
  validateProfile,
};
