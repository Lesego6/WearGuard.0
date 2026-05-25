const express = require('express');

const requireSession = require('../middleware/auth');

const router = express.Router();

async function postJson(url, payload) {
  if (!url) return false;
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is unavailable in this Node runtime.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed with status ${response.status}.`);
  }

  return true;
}

function formatCyberMessage(transcript) {
  const phrase = transcript ? String(transcript).trim() : 'not available';
  return `Possible social engineering or credential coercion detected. Phrase: ${phrase}`;
}

function parseOptionalHeartRate(heartRate) {
  if (heartRate === null || typeof heartRate === 'undefined' || heartRate === '') {
    return null;
  }

  const parsed = Number(heartRate);
  return Number.isFinite(parsed) ? parsed : null;
}

router.use(requireSession);

// Cyber-resilience alert routing for SIEM and security-team notifications.
router.post('/', async (req, res) => {
  try {
    const {
      type,
      transcript,
      heartRate,
      location,
      timestamp,
      securityWebhookUrl,
    } = req.body || {};

    console.warn('WearGuard cyber alert received:', {
      user: req.session.profile || null,
      type: type || 'cyber-coercion',
      transcript: transcript || '',
      heartRate: parseOptionalHeartRate(heartRate),
      location: location || null,
      timestamp: timestamp || new Date().toISOString(),
    });

    const channels = [];
    const targetUrl = securityWebhookUrl || process.env.SIEM_WEBHOOK_URL;
    const cyberPayload = {
      source: 'WearGuard',
      alertType: 'cyber-coercion',
      severity: 'HIGH',
      transcript: typeof transcript === 'string' ? transcript : '',
      heartRate: parseOptionalHeartRate(heartRate),
      location: location || null,
      timestamp: timestamp || new Date().toISOString(),
      message: formatCyberMessage(transcript),
    };

    if (targetUrl) {
      await postJson(targetUrl, cyberPayload);
      channels.push('webhook');
    }

    if (
      process.env.SECURITY_TEAM_EMAIL &&
      process.env.SENDGRID_API_KEY &&
      process.env.SENDGRID_FROM_EMAIL
    ) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const body = [
        'WearGuard Cyber-Coercion Alert',
        `User: ${req.session.profile && req.session.profile.name ? req.session.profile.name : 'Unknown user'}`,
        `Email: ${req.session.profile && req.session.profile.email ? req.session.profile.email : 'Unknown email'}`,
        `Alert type: cyber-coercion`,
        `Time: ${new Date(cyberPayload.timestamp).toLocaleString()}`,
        `Heart rate: ${cyberPayload.heartRate == null ? 'not available' : `${cyberPayload.heartRate} BPM`}`,
        `Transcript: ${cyberPayload.transcript || 'not available'}`,
        `Location: ${location ? JSON.stringify(location) : 'not available'}`,
        cyberPayload.message,
      ].join('\n');

      await sgMail.send({
        to: process.env.SECURITY_TEAM_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'WearGuard Cyber-Coercion Alert',
        text: body,
      });

      channels.push('email');
    }

    return res.json({
      ok: true,
      delivered: channels.length > 0,
      channels,
    });
  } catch (error) {
    console.error('Cyber dispatch failed:', error);
    return res.status(500).json({ error: 'Cyber dispatch failed.' });
  }
});

module.exports = router;
