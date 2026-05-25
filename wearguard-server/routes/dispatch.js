const express = require('express');

const requireSession = require('../middleware/auth');

const router = express.Router();

function formatAlertTime(timestamp) {
  const parsed = timestamp ? new Date(timestamp) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toLocaleString() : parsed.toLocaleString();
}

function formatMapsLink(location) {
  if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) {
    return 'not available';
  }

  return `https://maps.google.com/?q=${Number(location.lat)},${Number(location.lng)}`;
}

function formatHeartRate(heartRate) {
  const parsedHeartRate = parseOptionalHeartRate(heartRate);
  return parsedHeartRate == null ? 'not available' : `${parsedHeartRate} BPM`;
}

function parseOptionalHeartRate(heartRate) {
  if (heartRate === null || typeof heartRate === 'undefined' || heartRate === '') {
    return null;
  }

  const parsed = Number(heartRate);
  return Number.isFinite(parsed) ? parsed : null;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

router.use(requireSession);

// Emergency alert delivery across SMS, email, and outbound webhook channels.
router.post('/', async (req, res) => {
  try {
    const {
      type,
      contact,
      location,
      heartRate,
      transcript,
      timestamp,
      securityWebhookUrl,
    } = req.body || {};

    if (!contact || typeof contact !== 'object') {
      return res.status(400).json({ error: 'No contact provided.' });
    }

    const channels = [];
    const userName = req.session.profile && req.session.profile.name
      ? req.session.profile.name
      : 'WearGuard user';
    const alertType = String(type || 'emergency');
    const eventTime = formatAlertTime(timestamp);
    const mapsLink = formatMapsLink(location);
    const heartRateText = formatHeartRate(heartRate);
    const transcriptText = typeof transcript === 'string' ? transcript.trim() : '';

    const payload = {
      type: alertType,
      contact,
      location: location || null,
      heartRate: parseOptionalHeartRate(heartRate),
      transcript: transcriptText,
      timestamp: timestamp || new Date().toISOString(),
      securityWebhookUrl: typeof securityWebhookUrl === 'string' ? securityWebhookUrl : '',
      user: req.session.profile,
    };

    if (
      contact.phone &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
    ) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: contact.phone,
        body: [
          '🚨 WearGuard ALERT',
          `${userName} needs help.`,
          `Type: ${alertType}`,
          `Location: ${mapsLink}`,
          `HR: ${heartRateText}`,
          `Time: ${eventTime}`,
        ].join('\n'),
      });

      channels.push('sms');
    }

    if (
      contact.email &&
      process.env.SENDGRID_API_KEY &&
      process.env.SENDGRID_FROM_EMAIL
    ) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const subject = `WearGuard Emergency Alert for ${userName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #163b35; background: #f7f4ee; padding: 24px;">
          <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid rgba(22,59,53,0.1);">
            <div style="background: #d65a3f; color: #ffffff; padding: 20px 24px;">
              <h1 style="margin: 0; font-size: 24px;">WearGuard Emergency Alert</h1>
              <p style="margin: 8px 0 0;">${escapeHtml(userName)} may need immediate assistance.</p>
            </div>
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; font-weight: 700; border-bottom: 1px solid #ece7de;">User</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ece7de;">${escapeHtml(userName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; font-weight: 700; border-bottom: 1px solid #ece7de;">Alert type</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ece7de;">${escapeHtml(alertType)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; font-weight: 700; border-bottom: 1px solid #ece7de;">Time</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ece7de;">${escapeHtml(eventTime)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; font-weight: 700; border-bottom: 1px solid #ece7de;">Heart rate</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ece7de;">${escapeHtml(heartRateText)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; font-weight: 700; border-bottom: 1px solid #ece7de;">Location</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ece7de;">
                      ${mapsLink === 'not available'
                        ? 'not available'
                        : `<a href="${escapeHtml(mapsLink)}" style="color: #198a73;">Open in Google Maps</a>`}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; font-weight: 700; vertical-align: top;">Voice transcript</td>
                    <td style="padding: 10px 12px;">${escapeHtml(transcriptText || 'not available')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      const text = [
        'WearGuard Emergency Alert',
        `${userName} needs help.`,
        `Type: ${alertType}`,
        `Time: ${eventTime}`,
        `Heart rate: ${heartRateText}`,
        `Location: ${mapsLink}`,
        `Transcript: ${transcriptText || 'not available'}`,
      ].join('\n');

      await sgMail.send({
        to: contact.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
      });

      channels.push('email');
    }

    if (securityWebhookUrl) {
      await postJson(securityWebhookUrl, payload);
      channels.push('webhook');
    }

    return res.json({
      ok: true,
      delivered: channels.length > 0,
      channels,
    });
  } catch (error) {
    console.error('Emergency dispatch failed:', error);
    return res.status(500).json({ error: 'Emergency dispatch failed.' });
  }
});

module.exports = router;
