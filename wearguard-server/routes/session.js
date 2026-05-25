const express = require('express');

const router = express.Router();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function buildSessionPayload(req) {
  return {
    ok: true,
    authenticated: true,
    profile: req.session.profile,
    remembered: Boolean(req.session.remembered),
    storageKey: req.session.storageKey,
  };
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

// Restore an existing trusted-device session.
router.get('/', async (req, res) => {
  try {
    if (req.session && req.session.profile && req.session.storageKey) {
      return res.json(buildSessionPayload(req));
    }

    return res.status(401).json({ error: 'No active session.' });
  } catch (error) {
    console.error('Session restore failed:', error);
    return res.status(500).json({ error: 'Session restore failed.' });
  }
});

// Create a new session from the WearGuard sign-in form.
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name : '';
    const email = typeof body.email === 'string' ? body.email : '';
    const remember = Boolean(body.remember);
    const honeypot = typeof body.honeypot === 'string' ? body.honeypot : '';

    if (honeypot.trim()) {
      return res.status(400).json({ error: 'Request blocked.' });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid name and email address.' });
    }

    const storageKey = `wearguard-user:${normalizedEmail}`;

    req.session.profile = {
      name: normalizedName,
      email: normalizedEmail,
    };
    req.session.storageKey = storageKey;
    req.session.remembered = remember;

    if (remember) {
      req.session.cookie.maxAge = THIRTY_DAYS_MS;
    } else {
      req.session.cookie.expires = false;
    }

    await saveSession(req);

    return res.json(buildSessionPayload(req));
  } catch (error) {
    console.error('Session sign-in failed:', error);
    return res.status(500).json({ error: 'Session sign-in failed.' });
  }
});

// Forget the device and clear the session cookie.
router.delete('/', async (req, res) => {
  try {
    await destroySession(req);

    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Session sign-out failed:', error);
    return res.status(500).json({ error: 'Session sign-out failed.' });
  }
});

module.exports = router;
