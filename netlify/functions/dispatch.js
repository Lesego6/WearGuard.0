const crypto = require('crypto');
const {
  getEnv,
  getWebhookSigningSecret,
  json,
  methodNotAllowed,
  readJsonBody,
  readSessionFromEvent,
  unauthorized,
} = require('./_shared/security');

const ALLOWED_KINDS = new Set(['emergency', 'location']);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return methodNotAllowed(['POST']);
    }

    const session = readSessionFromEvent(event);
    if (!session) return unauthorized();

    const body = readJsonBody(event);
    if (!body || !ALLOWED_KINDS.has(String(body.kind || ''))) {
      return json(400, { ok: false, error: 'Unsupported secure dispatch payload.' });
    }

    const payload = body.payload;
    if (!payload || typeof payload !== 'object') {
      return json(400, { ok: false, error: 'Missing secure dispatch payload.' });
    }

    const webhookUrl = getEnv('WEARGUARD_ALERT_WEBHOOK_URL');
    if (!webhookUrl) {
      return json(200, {
        ok: true,
        delivered: false,
        mode: 'client-fallback',
        message: 'Secure relay is not configured on the server.',
      });
    }

    const envelope = {
      kind: body.kind,
      session: {
        name: session.name,
        email: session.email,
      },
      receivedAt: new Date().toISOString(),
      payload,
    };

    const rawBody = JSON.stringify(envelope);
    const signature = crypto
      .createHmac('sha256', getWebhookSigningSecret())
      .update(rawBody)
      .digest('hex');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WearGuard-Signature': `sha256=${signature}`,
        'X-WearGuard-Dispatch': String(body.kind),
      },
      body: rawBody,
    });

    if (!response.ok) {
      return json(502, {
        ok: false,
        delivered: false,
        error: 'Secure relay rejected the dispatch request.',
      });
    }

    return json(200, {
      ok: true,
      delivered: true,
      mode: 'server-relay',
      message: 'Payload forwarded through the secure relay.',
    });
  } catch (error) {
    return json(500, {
      ok: false,
      delivered: false,
      error: error && error.message ? error.message : 'Secure relay failed.',
    });
  }
};
