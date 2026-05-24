const {
  clearSessionCookie,
  createSessionCookie,
  createSessionPayload,
  isAllowedEmail,
  json,
  methodNotAllowed,
  readJsonBody,
  readSessionFromEvent,
  unauthorized,
  validateProfile,
} = require('./_shared/security');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const session = readSessionFromEvent(event);
      if (!session) return unauthorized();
      return json(200, createSessionPayload(session));
    }

    if (event.httpMethod === 'DELETE') {
      return json(200, { ok: true, cleared: true }, {
        'Set-Cookie': clearSessionCookie(),
      });
    }

    if (event.httpMethod !== 'POST') {
      return methodNotAllowed(['GET', 'POST', 'DELETE']);
    }

    const body = readJsonBody(event);
    if (!body) {
      return json(400, { ok: false, error: 'Invalid request body.' });
    }

    if (String(body.honeypot || '').trim()) {
      return json(400, { ok: false, error: 'Request blocked.' });
    }

    const profile = validateProfile(body);
    if (!profile) {
      return json(400, { ok: false, error: 'Enter a valid name and email address.' });
    }

    if (!isAllowedEmail(profile.email)) {
      return json(403, { ok: false, error: 'This email address is not allowed for WearGuard.' }, {
        'Set-Cookie': clearSessionCookie(),
      });
    }

    const remember = Boolean(body.remember);
    const session = {
      ...profile,
      remembered: remember,
    };

    return json(200, createSessionPayload(session), {
      'Set-Cookie': createSessionCookie(profile, remember),
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error && error.message ? error.message : 'Secure session setup failed.',
    }, {
      'Set-Cookie': clearSessionCookie(),
    });
  }
};
