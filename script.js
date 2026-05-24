/* â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const state = {
  heartRate: 84,
  alertActive: false,
  booted: false,
  conversation: 'routine',   // routine | concern | danger
  codeWord: '',
  contacts: [],              // {id, name, phone, whatsapp, email, primary}
  events: [],
  countdown: null,           // {deadline, timerId, tickerId}
  locationSharing: false,
  locationTimer: null,
  locationContact: null,
  locationWatchId: null,
  locationShareEndsAt: null,
  lastLocation: null,
  lastLocationSentAt: 0,
  alertWebhookUrl: '',
  locationWebhookUrl: '',
  emailJsServiceId: 'service_8poulyg',
  emailJsTemplateId: 'template_05wae3g',
  emailJsPublicKey: 'atla3KOLVkfnvh387',
  recognition: null,
  voiceSupported: false,
  voiceListening: false,
  voiceTranscript: '',
  voiceInterim: '',
  voiceAutoMode: true,
  voiceRestartPending: false,
  voiceRestartTimer: null,
  voicePermissionBlocked: false,
  authProfile: null,
  authRemembered: false,
  authLocked: true,
};

const DANGER_SIGNALS  = ['help','danger','unsafe','attack','followed','hurt','trapped','panic','emergency','stalker',"can't breathe","dont feel safe","do not feel safe","i need help","please help"];
const CONCERN_SIGNALS = ['worried','nervous','anxious','late','check in','check-in','lost','tense','something feels off','uncomfortable','uneasy'];
const STORAGE_KEY = 'wearguard-settings-v2';
const AUTH_DEVICE_KEY = 'wearguard-device-access-v1';
const AUTH_SESSION_KEY = 'wearguard-device-session-v1';
const LOCATION_UPDATE_INTERVAL_MS = 60 * 1000;
const VOICE_RESTART_DELAY_MS = 900;
const REMOVED_AUTO_CONTACT = {
  id: 2040793019099,
  name: 'Lesego Moeng',
  phone: '',
  whatsapp: '0793019099',
  email: 'lesegomoeng0204@gmail.con',
};

/* â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
window.addEventListener('DOMContentLoaded', () => {
  restorePersistedSettings();
  restoreDeviceAccess();
  bindAuthForm();
  renderAll();

  if (state.authProfile) {
    unlockWearGuard({ silent: true, skipToast: true });
    return;
  }

  lockWearGuard();
});

function bootWearGuard() {
  if (!state.booted) {
    logEvent({
      title: 'Emergency mode ready',
      detail: 'Watch connected, heart-rate monitoring is live, Safety AI is waiting for a private code word.',
      icon: 'fas fa-shield-halved',
      accent: '#198A73',
    });
    initVoiceRecognition();
    state.booted = true;
  }

  renderAll();
  startVoiceRecognition({ silent: true });
}

function bindAuthForm() {
  const authForm = document.getElementById('authForm');
  if (!authForm || authForm.dataset.bound === 'true') return;

  authForm.addEventListener('submit', handleDeviceLogin);
  authForm.dataset.bound = 'true';
}

function handleDeviceLogin(event) {
  event.preventDefault();

  const nameInput = document.getElementById('authNameInput');
  const emailInput = document.getElementById('authEmailInput');
  const rememberInput = document.getElementById('authRememberInput');
  const honeypotInput = document.getElementById('authWebsiteInput');

  const honeypotValue = honeypotInput ? honeypotInput.value.trim() : '';
  if (honeypotValue) {
    setAuthStatus('Request blocked.', 'error');
    return;
  }

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const remember = Boolean(rememberInput && rememberInput.checked);

  if (!name) {
    setAuthStatus('Enter your name first.', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!isValidEmail(email)) {
    setAuthStatus('Enter a valid email address.', 'error');
    if (emailInput) emailInput.focus();
    return;
  }

  saveDeviceAccess({ name, email }, remember);
  state.authProfile = { name, email };
  state.authRemembered = remember;
  setAuthStatus(remember ? 'This device is trusted.' : 'Signed in for this session.', 'success');
  unlockWearGuard({ silent: true });
  showToast(remember ? 'This device will skip login next time.' : 'Signed in for this session.', 'teal');
  logEvent({
    title: 'Device access granted',
    detail: remember ? `${name} trusted this browser for future WearGuard sign-ins.` : `${name} signed in for the current session only.`,
    icon: 'fas fa-user-shield',
    accent: '#198A73',
  });
}

function unlockWearGuard(options) {
  const settings = options || {};
  state.authLocked = false;
  document.body.classList.remove('auth-locked');
  const authGate = document.getElementById('authGate');
  if (authGate) authGate.classList.add('hidden');
  updateDeviceAccessUi();
  if (!settings.silent) {
    setAuthStatus('WearGuard is ready.', 'success');
  }
  bootWearGuard();
}

function lockWearGuard() {
  state.authLocked = true;
  document.body.classList.add('auth-locked');
  const authGate = document.getElementById('authGate');
  if (authGate) authGate.classList.remove('hidden');
  pauseVoiceRecognitionForLock();
  updateDeviceAccessUi();
  setAuthStatus('Sign in to continue.', '');
}

function forgetTrustedDevice() {
  clearDeviceAccess();
  state.authProfile = null;
  state.authRemembered = false;
  clearAuthForm();
  lockWearGuard();
  setAuthStatus('Trusted device cleared. Sign in again to continue.', '');
  showToast('Trusted device cleared. Sign in again to continue.', 'amber');
  logEvent({
    title: 'Device trust removed',
    detail: 'WearGuard will ask for sign-in again on this browser.',
    icon: 'fas fa-rotate-left',
    accent: '#F0A03A',
  });
}

function pauseVoiceRecognitionForLock() {
  state.voiceAutoMode = false;
  state.voicePermissionBlocked = false;
  clearVoiceRestartTimer();

  if (state.recognition && state.voiceListening) {
    try {
      state.recognition.stop();
    } catch (error) {
      // Ignore stop errors while locking the experience.
    }
  }

  updateVoiceUI();
}

function updateDeviceAccessUi() {
  const title = document.getElementById('deviceAccessTitle');
  const text = document.getElementById('deviceAccessText');
  const forgetBtn = document.getElementById('forgetDeviceBtn');
  if (!title || !text || !forgetBtn) return;

  if (state.authProfile && state.authRemembered) {
    title.textContent = 'This device is trusted.';
    text.textContent = `WearGuard will open without the login on this browser for ${state.authProfile.name}.`;
    forgetBtn.disabled = false;
    return;
  }

  if (state.authProfile) {
    title.textContent = 'Session-only access is active.';
    text.textContent = `WearGuard is unlocked for ${state.authProfile.name} during this session only.`;
    forgetBtn.disabled = false;
    return;
  }

  title.textContent = 'This device is not trusted yet.';
  text.textContent = 'Sign in and keep remember enabled if you want WearGuard to skip the login here next time.';
  forgetBtn.disabled = true;
}

function setAuthStatus(message, tone) {
  const authStatus = document.getElementById('authStatusText');
  if (!authStatus) return;

  authStatus.className = 'auth-status';
  if (tone === 'error') authStatus.classList.add('error');
  if (tone === 'success') authStatus.classList.add('success');
  authStatus.textContent = message;
}

function clearAuthForm() {
  const nameInput = document.getElementById('authNameInput');
  const emailInput = document.getElementById('authEmailInput');
  const rememberInput = document.getElementById('authRememberInput');
  const honeypotInput = document.getElementById('authWebsiteInput');

  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (rememberInput) rememberInput.checked = true;
  if (honeypotInput) honeypotInput.value = '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function restoreDeviceAccess() {
  let profile = null;
  let remembered = false;

  try {
    const savedDevice = localStorage.getItem(AUTH_DEVICE_KEY);
    if (savedDevice) {
      profile = normalizeDeviceAccess(JSON.parse(savedDevice));
      remembered = Boolean(profile);
    }
  } catch (error) {
    profile = null;
  }

  if (!profile) {
    try {
      const savedSession = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (savedSession) {
        profile = normalizeDeviceAccess(JSON.parse(savedSession));
      }
    } catch (error) {
      profile = null;
    }
  }

  state.authProfile = profile;
  state.authRemembered = remembered;

  const nameInput = document.getElementById('authNameInput');
  const emailInput = document.getElementById('authEmailInput');
  const rememberInput = document.getElementById('authRememberInput');
  if (profile && nameInput) nameInput.value = profile.name;
  if (profile && emailInput) emailInput.value = profile.email;
  if (rememberInput) rememberInput.checked = remembered || !profile;

  updateDeviceAccessUi();
}

function normalizeDeviceAccess(value) {
  if (!value || typeof value !== 'object') return null;
  const name = String(value.name || '').trim();
  const email = String(value.email || '').trim().toLowerCase();
  if (!name || !isValidEmail(email)) return null;
  return { name, email };
}

function saveDeviceAccess(profile, remember) {
  const serialized = JSON.stringify({
    name: profile.name,
    email: profile.email,
    savedAt: new Date().toISOString(),
  });

  try {
    if (remember) {
      localStorage.setItem(AUTH_DEVICE_KEY, serialized);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
      localStorage.removeItem(AUTH_DEVICE_KEY);
    }
  } catch (error) {
    // Ignore storage failures and fall back to the live session state only.
  }
}

function clearDeviceAccess() {
  try {
    localStorage.removeItem(AUTH_DEVICE_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch (error) {
    // Ignore storage failures during sign-out.
  }
}

function persistSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      codeWord: state.codeWord,
      contacts: state.contacts,
      alertWebhookUrl: state.alertWebhookUrl,
      locationWebhookUrl: state.locationWebhookUrl,
      emailJsServiceId: state.emailJsServiceId,
      emailJsTemplateId: state.emailJsTemplateId,
      emailJsPublicKey: state.emailJsPublicKey,
    }));
  } catch (error) {
    // Ignore storage failures and keep the session usable.
  }
}

function restorePersistedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.codeWord = typeof saved.codeWord === 'string' ? saved.codeWord : '';
      state.contacts = Array.isArray(saved.contacts)
        ? saved.contacts.map(normalizeContact).filter(Boolean)
        : [];
      state.alertWebhookUrl = typeof saved.alertWebhookUrl === 'string' ? saved.alertWebhookUrl : '';
      state.locationWebhookUrl = typeof saved.locationWebhookUrl === 'string' ? saved.locationWebhookUrl : '';
      state.emailJsServiceId = typeof saved.emailJsServiceId === 'string' && saved.emailJsServiceId
        ? saved.emailJsServiceId
        : 'service_8poulyg';
      state.emailJsTemplateId = typeof saved.emailJsTemplateId === 'string' && saved.emailJsTemplateId
        ? saved.emailJsTemplateId
        : 'template_05wae3g';
      state.emailJsPublicKey = typeof saved.emailJsPublicKey === 'string' && saved.emailJsPublicKey && saved.emailJsPublicKey !== 'eAvmDhqeqF6LGBVPqE8Kd'
        ? saved.emailJsPublicKey
        : 'atla3KOLVkfnvh387';
    }
  } catch (error) {
    state.contacts = [];
  }

  if (state.contacts.length && !state.contacts.some(c => c.primary)) {
    state.contacts[0].primary = true;
  }

  removeAutoAddedEmergencyContact();

  const alertInput = document.getElementById('alertWebhookInput');
  const locationInput = document.getElementById('locationWebhookInput');
  const emailJsServiceInput = document.getElementById('emailJsServiceInput');
  const emailJsTemplateInput = document.getElementById('emailJsTemplateInput');
  const emailJsPublicKeyInput = document.getElementById('emailJsPublicKeyInput');
  if (alertInput) alertInput.value = state.alertWebhookUrl;
  if (locationInput) locationInput.value = state.locationWebhookUrl;
  if (emailJsServiceInput) emailJsServiceInput.value = state.emailJsServiceId || 'service_8poulyg';
  if (emailJsTemplateInput) emailJsTemplateInput.value = state.emailJsTemplateId;
  if (emailJsPublicKeyInput) emailJsPublicKeyInput.value = state.emailJsPublicKey;
}

function normalizeContact(contact) {
  if (!contact || !contact.name) return null;
  return {
    id: contact.id || Date.now() + Math.floor(Math.random() * 1000),
    name: String(contact.name || '').trim(),
    phone: String(contact.phone || '').trim(),
    whatsapp: String(contact.whatsapp || '').trim(),
    email: String(contact.email || '').trim(),
    primary: Boolean(contact.primary),
  };
}

function removeAutoAddedEmergencyContact() {
  const before = state.contacts.length;
  state.contacts = state.contacts.filter((contact) => !(
    contact.id === REMOVED_AUTO_CONTACT.id ||
    (
      contact.name === REMOVED_AUTO_CONTACT.name &&
      contact.whatsapp === REMOVED_AUTO_CONTACT.whatsapp &&
      contact.email === REMOVED_AUTO_CONTACT.email
    )
  ));

  if (state.contacts.length && !state.contacts.some(c => c.primary)) {
    state.contacts[0].primary = true;
  }

  if (state.contacts.length !== before) {
    persistSettings();
  }
}

function syncDeliveryConfigFromInputs() {
  const alertInput = document.getElementById('alertWebhookInput');
  const locationInput = document.getElementById('locationWebhookInput');
  const emailJsServiceInput = document.getElementById('emailJsServiceInput');
  const emailJsTemplateInput = document.getElementById('emailJsTemplateInput');
  const emailJsPublicKeyInput = document.getElementById('emailJsPublicKeyInput');
  state.alertWebhookUrl = alertInput ? alertInput.value.trim() : state.alertWebhookUrl;
  state.locationWebhookUrl = locationInput ? locationInput.value.trim() : state.locationWebhookUrl;
  state.emailJsServiceId = emailJsServiceInput ? (emailJsServiceInput.value.trim() || 'service_8poulyg') : state.emailJsServiceId;
  state.emailJsTemplateId = emailJsTemplateInput ? emailJsTemplateInput.value.trim() : state.emailJsTemplateId;
  state.emailJsPublicKey = emailJsPublicKeyInput ? emailJsPublicKeyInput.value.trim() : state.emailJsPublicKey;
}

function saveDeliveryConfig() {
  syncDeliveryConfigFromInputs();
  persistSettings();
  showToast('Delivery endpoints saved.', 'teal');
  logEvent({
    title: 'Delivery settings saved',
    detail: 'Webhook endpoints and EmailJS delivery settings were updated.',
    icon: 'fas fa-tower-broadcast',
    accent: '#198A73',
  });
}

function sanitizePhoneNumber(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function sanitizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return '27' + digits.slice(1);
  }
  return digits;
}

function positionToLocation(position) {
  const lat = Number(position.coords.latitude);
  const lng = Number(position.coords.longitude);
  const location = {
    lat,
    lng,
    accuracy: Math.round(position.coords.accuracy || 0),
    timestamp: new Date(position.timestamp || Date.now()).toISOString(),
    mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
  };
  state.lastLocation = location;
  return location;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatLocationText(location) {
  if (!location) return 'Location unavailable';
  const acc = location.accuracy ? `, accuracy ${location.accuracy}m` : '';
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}${acc}`;
}

function getLocationErrorMessage(error) {
  if (!error) return 'Location unavailable.';
  if (error.code === 1) return 'Location permission was denied.';
  if (error.code === 2) return 'WearGuard could not determine your current location.';
  if (error.code === 3) return 'Location lookup timed out.';
  return 'Location unavailable.';
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(positionToLocation(position)),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

function buildEmergencyPayload(reason, location, source) {
  return {
    type: 'emergency-alert',
    app: 'WearGuard',
    source: source || 'manual',
    reason,
    heartRate: state.heartRate,
    transcript: state.voiceTranscript || '',
    codeWord: state.codeWord || '',
    timestamp: new Date().toISOString(),
    location,
    contacts: state.contacts.map(({ name, phone, whatsapp, email, primary }) => ({
      name, phone, whatsapp, email, primary,
    })),
  };
}

function buildEmergencyMessage(payload) {
  return [
    'WEARGUARD EMERGENCY ALERT',
    payload.reason,
    `Time: ${formatDateTime(payload.timestamp)}`,
    `Heart rate: ${payload.heartRate} BPM`,
    payload.transcript ? `Detected phrase: "${payload.transcript}"` : '',
    `Location: ${formatLocationText(payload.location)}`,
    payload.location ? `Map: ${payload.location.mapsUrl}` : '',
  ].filter(Boolean).join('\n');
}

function buildLocationPayload(contact, location, context) {
  return {
    type: 'live-location-update',
    app: 'WearGuard',
    contact: contact ? { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone, whatsapp: contact.whatsapp } : null,
    mode: context.mode,
    reason: context.reason || '',
    minutes: context.minutes || 0,
    heartRate: state.heartRate,
    timestamp: new Date().toISOString(),
    location,
  };
}

function buildLocationMessage(contact, payload) {
  const label = contact ? contact.name : 'your trusted contact';
  const lines = [
    'WEARGUARD LIVE LOCATION',
    `For: ${label}`,
    payload.reason || 'Current location update',
    `Time: ${formatDateTime(payload.timestamp)}`,
    `Heart rate: ${payload.heartRate} BPM`,
    `Location: ${formatLocationText(payload.location)}`,
    payload.location ? `Map: ${payload.location.mapsUrl}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

async function postWebhook(url, payload) {
  if (!url) return false;
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    try {
      const sent = navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
      if (sent) return true;
    } catch (error) {
      // Fall through to fetch.
    }
  }

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
    });
    return true;
  } catch (error) {
    return false;
  }
}

function canUseEmailJs() {
  return Boolean(state.emailJsServiceId && state.emailJsTemplateId && state.emailJsPublicKey);
}

function getEmailJsMissingFields() {
  const missing = [];
  if (!state.emailJsServiceId) missing.push('service ID');
  if (!state.emailJsTemplateId) missing.push('template ID');
  if (!state.emailJsPublicKey) missing.push('public key');
  return missing;
}

function formatMissingFieldList(fields) {
  if (!fields.length) return '';
  if (fields.length === 1) return fields[0];
  if (fields.length === 2) return `${fields[0]} and ${fields[1]}`;
  return `${fields.slice(0, -1).join(', ')}, and ${fields[fields.length - 1]}`;
}

function isEmailJsPreferredForEmail(contact) {
  return Boolean(contact && contact.email && state.emailJsServiceId);
}

function buildEmailJsTemplateParams(contact, subject, message, payload) {
  const location = payload && payload.location ? payload.location : null;
  return {
    app_name: 'WearGuard',
    to_name: contact && contact.name ? contact.name : 'Emergency Contact',
    to_email: contact && contact.email ? contact.email : '',
    subject,
    message,
    alert_type: payload && payload.type ? payload.type : 'notification',
    reason: payload && payload.reason ? payload.reason : '',
    timestamp: payload && payload.timestamp ? payload.timestamp : new Date().toISOString(),
    heart_rate: payload && payload.heartRate ? String(payload.heartRate) : '',
    transcript: payload && payload.transcript ? payload.transcript : '',
    location_text: location ? formatLocationText(location) : 'Location unavailable',
    maps_url: location ? location.mapsUrl : '',
  };
}

async function sendEmailViaEmailJs(contact, subject, message, payload) {
  if (!contact || !contact.email || !canUseEmailJs()) return false;

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: state.emailJsServiceId,
        template_id: state.emailJsTemplateId,
        user_id: state.emailJsPublicKey,
        template_params: buildEmailJsTemplateParams(contact, subject, message, payload),
      }),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function openExternalLink(url) {
  if (!url) return false;

  if (/^(mailto:|tel:|sms:)/i.test(url)) {
    window.location.href = url;
    return true;
  }

  if (!/^https?:/i.test(url)) {
    return false;
  }

  try {
    const popup = window.open(url, '_blank', 'noopener');
    if (popup) {
      popup.opener = null;
      return true;
    }
  } catch (error) {
    // Fall back to same-window navigation below when possible.
  }

  return false;
}

function buildContactRoutes(contact, subject, message, options) {
  const routes = [];
  const whatsapp = sanitizeWhatsAppNumber(contact && contact.whatsapp);
  const phone = sanitizePhoneNumber(contact && contact.phone);

  if (whatsapp) {
    routes.push({
      channel: 'WhatsApp',
      url: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
    });
  }

  if (contact && contact.email && !(options && options.skipEmail)) {
    routes.push({
      channel: 'Email',
      url: `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
    });
  }

  if (options.allowSms && phone) {
    routes.push({
      channel: 'SMS',
      url: `sms:${phone}?body=${encodeURIComponent(message)}`,
    });
  }

  if (options.allowCall && phone) {
    routes.push({
      channel: 'Phone',
      url: `tel:${phone}`,
    });
  }

  return routes;
}

function deliverToContact(contact, subject, message, options) {
  if (!contact) return [];
  const routes = buildContactRoutes(contact, subject, message, options || {});
  if (!routes.length) return [];

  const delivered = [];
  const maxRoutes = options && options.openAll ? routes.length : 1;
  routes.slice(0, maxRoutes).forEach((route) => {
    if (openExternalLink(route.url)) {
      delivered.push(route.channel);
    }
  });
  return delivered;
}

function setPanicUiState(active) {
  const btn = document.getElementById('panicBtn');
  const label = document.getElementById('panicBtnLabel');
  const hint = document.getElementById('panicHint');

  if (!btn || !label || !hint) return;

  btn.classList.toggle('active', active);
  label.textContent = active ? 'Alert Sent' : 'Send Emergency Alert';
  hint.textContent = active
    ? 'Help is on the way. Tap again to cancel alert.'
    : 'Hold to confirm - Sends to emergency contacts';
}

function hasReachableContactRoute(contact) {
  if (!contact) return false;
  return Boolean(contact.whatsapp || contact.email || contact.phone);
}

/* â”€â”€ CLASSIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function classifyPhrase(phrase) {
  const p = phrase.toLowerCase();
  const cw = state.codeWord.toLowerCase().trim();
  if (cw && p.includes(cw)) return 'danger';
  if (DANGER_SIGNALS.some(s => p.includes(s)))  return 'danger';
  if (CONCERN_SIGNALS.some(s => p.includes(s))) return 'concern';
  return 'routine';
}

function analysePhrase(spokenPhrase) {
  const phrase = (spokenPhrase || state.voiceTranscript || '').trim();
  if (!phrase) {
    showToast('Let voice monitoring run and speak a phrase for Safety AI to analyse.');
    return;
  }
  const cls = classifyPhrase(phrase);
  state.voiceTranscript = phrase;
  state.voiceInterim = '';
  updateVoiceUI();
  state.conversation = cls;
  const aiEl = document.getElementById('aiResponse');
  aiEl.className = 'ai-response ' + cls;

  if (cls === 'danger') {
    aiEl.textContent = 'Danger signals detected. Emergency alert sent immediately.';
    cancelCountdown(true);
    logEvent({ title: 'Danger phrase detected', detail: `"${phrase}" - emergency alert dispatched immediately.`, icon: 'fas fa-triangle-exclamation', accent: '#D65A3F' });
    if (!state.alertActive) {
      sendEmergencyAlert('Safety AI detected a dangerous conversation.', { source: 'safety-ai' });
    }
  } else if (cls === 'concern') {
    aiEl.textContent = 'Concern signals detected. Safety AI is watching. Tap the panic button if you need help.';
    logEvent({ title: 'Concern phrase detected', detail: `"${phrase}" - monitoring elevated.`, icon: 'fas fa-circle-exclamation', accent: '#F0A03A' });
  } else {
    aiEl.textContent = 'Routine conversation detected. No safety signals found. Stay safe out there.';
    logEvent({ title: 'Routine check', detail: `"${phrase}" - no threats detected.`, icon: 'fas fa-check-circle', accent: '#198A73' });
  }
  updateBanner();
  updateChips();
}

/* â”€â”€ CODE WORD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.voiceSupported = Boolean(SpeechRecognition);

  if (!state.voiceSupported) {
    updateVoiceUI();
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-ZA';

  recognition.onstart = () => {
    clearVoiceRestartTimer();
    state.voiceListening = true;
    state.voiceInterim = '';
    state.voicePermissionBlocked = false;
    updateVoiceUI();
  };

  recognition.onresult = (event) => {
    let finalText = '';
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      if (!transcript) continue;

      if (result.isFinal) {
        finalText += (finalText ? ' ' : '') + transcript;
      } else {
        interimText += (interimText ? ' ' : '') + transcript;
      }
    }

    if (finalText) {
      state.voiceTranscript = finalText;
    }
    state.voiceInterim = interimText;
    updateVoiceUI();

    if (finalText) {
      analysePhrase(finalText);
    }
  };

  recognition.onerror = (event) => {
    state.voiceListening = false;
    state.voiceInterim = '';

    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      state.voiceAutoMode = false;
      state.voicePermissionBlocked = true;
      clearVoiceRestartTimer();
      showToast('Microphone access was blocked. Allow mic access to use voice recognition.', 'amber');
    } else if (event.error === 'audio-capture') {
      state.voiceAutoMode = false;
      clearVoiceRestartTimer();
      showToast('No microphone was found. Connect a microphone and start voice recognition again.', 'amber');
    } else if (event.error === 'no-speech') {
      // Silence is normal in always-on mode; onend will restart when needed.
    } else if (event.error !== 'aborted') {
      if (!state.voiceAutoMode) {
        showToast('Voice recognition stopped. Please try again.', 'amber');
      }
    }

    updateVoiceUI();
  };

  recognition.onend = () => {
    state.voiceListening = false;
    state.voiceInterim = '';
    if (state.voiceAutoMode && !state.voicePermissionBlocked) {
      scheduleVoiceRecognitionRestart();
    }
    updateVoiceUI();
  };

  state.recognition = recognition;
  updateVoiceUI();
}

function toggleVoiceRecognition() {
  if (state.authLocked || !state.booted) return;

  if (state.voiceListening || state.voiceRestartPending || state.voiceAutoMode) {
    stopVoiceRecognition(true);
  } else {
    state.voiceAutoMode = true;
    state.voicePermissionBlocked = false;
    startVoiceRecognition();
  }
}

function clearVoiceRestartTimer() {
  if (state.voiceRestartTimer) {
    clearTimeout(state.voiceRestartTimer);
    state.voiceRestartTimer = null;
  }
  state.voiceRestartPending = false;
}

function scheduleVoiceRecognitionRestart() {
  if (state.voiceRestartTimer || !state.voiceSupported || state.voiceListening || !state.voiceAutoMode || state.authLocked) return;
  state.voiceRestartPending = true;
  updateVoiceUI();
  state.voiceRestartTimer = setTimeout(() => {
    state.voiceRestartTimer = null;
    state.voiceRestartPending = false;
    startVoiceRecognition({ silent: true });
  }, VOICE_RESTART_DELAY_MS);
}

function startVoiceRecognition(options) {
  const silent = Boolean(options && options.silent);

  if (state.authLocked || !state.booted) {
    updateVoiceUI();
    return;
  }

  if (!state.recognition) {
    initVoiceRecognition();
  }

  if (!state.voiceSupported || !state.recognition) {
    if (!silent) {
      showToast('Voice recognition is not supported in this browser.', 'amber');
    }
    updateVoiceUI();
    return;
  }

  clearVoiceRestartTimer();

  try {
    state.voiceInterim = '';
    state.recognition.start();
  } catch (error) {
    if (!state.voiceListening && !silent) {
      showToast('Voice recognition is not ready yet. Please try again.', 'amber');
    }
    if (state.voiceAutoMode && !state.voicePermissionBlocked) {
      scheduleVoiceRecognitionRestart();
    } else {
      updateVoiceUI();
    }
  }
}

function stopVoiceRecognition(manual) {
  if (manual) {
    state.voiceAutoMode = false;
    state.voicePermissionBlocked = false;
  }
  clearVoiceRestartTimer();

  if (state.recognition && state.voiceListening) {
    state.recognition.stop();
    return;
  }

  updateVoiceUI();
}

function clearVoiceTranscript() {
  state.voiceTranscript = '';
  state.voiceInterim = '';
  updateVoiceUI();
}

function updateVoiceUI() {
  const voiceState = document.getElementById('voiceState');
  const voiceStateText = document.getElementById('voiceStateText');
  const voiceTranscript = document.getElementById('voiceTranscript');
  const voiceHelper = document.getElementById('voiceHelper');
  const voiceListenBtn = document.getElementById('voiceListenBtn');

  if (!voiceState || !voiceStateText || !voiceTranscript || !voiceHelper || !voiceListenBtn) return;

  voiceState.classList.remove('listening');
  voiceListenBtn.classList.remove('listening');
  voiceListenBtn.disabled = false;

  if (!state.booted || state.authLocked) {
    voiceStateText.textContent = 'Locked';
    voiceTranscript.textContent = 'Sign in to start automatic voice safety monitoring.';
    voiceTranscript.className = 'voice-transcript placeholder';
    voiceHelper.textContent = 'WearGuard will start voice recognition as soon as you unlock the device.';
    voiceListenBtn.innerHTML = '<i class="fas fa-user-shield"></i> Login required';
    voiceListenBtn.disabled = true;
    return;
  }

  if (!state.voiceSupported) {
    voiceStateText.textContent = 'Unavailable';
    voiceTranscript.textContent = 'This browser does not support speech recognition. Open the page in a browser with Web Speech support to use voice detection.';
    voiceTranscript.className = 'voice-transcript has-text';
    voiceHelper.textContent = 'Save your code word now, then use a supported browser to let Safety AI listen for it.';
    voiceListenBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Voice not supported';
    voiceListenBtn.disabled = true;
    return;
  }

  if (state.voiceListening) {
    voiceState.classList.add('listening');
    voiceListenBtn.classList.add('listening');
    voiceStateText.textContent = 'Listening';
    voiceListenBtn.innerHTML = '<i class="fas fa-stop"></i> Stop listening';
    if (state.voiceInterim) {
      voiceTranscript.textContent = state.voiceInterim;
      voiceTranscript.className = 'voice-transcript live';
    } else if (state.voiceTranscript) {
      voiceTranscript.textContent = state.voiceTranscript;
      voiceTranscript.className = 'voice-transcript has-text';
    } else {
      voiceTranscript.textContent = 'Listening for your spoken safety check...';
      voiceTranscript.className = 'voice-transcript live';
    }
    voiceHelper.textContent = 'Always-on voice safety is active. Speak naturally and Safety AI will analyse captured speech.';
    return;
  }

  if (state.voicePermissionBlocked) {
    voiceStateText.textContent = 'Mic blocked';
    voiceListenBtn.innerHTML = '<i class="fas fa-microphone"></i> Retry microphone';
    if (state.voiceTranscript) {
      voiceTranscript.textContent = state.voiceTranscript;
      voiceTranscript.className = 'voice-transcript has-text';
    } else {
      voiceTranscript.textContent = 'Microphone access is blocked. Allow mic access to turn voice safety monitoring back on.';
      voiceTranscript.className = 'voice-transcript placeholder';
    }
    voiceHelper.textContent = 'Allow microphone access in the browser, then use the button to start always-on listening again.';
    return;
  }

  if (state.voiceAutoMode || state.voiceRestartPending) {
    voiceStateText.textContent = state.voiceRestartPending ? 'Reconnecting' : 'Starting';
    voiceListenBtn.innerHTML = '<i class="fas fa-stop"></i> Pause listening';
    if (state.voiceTranscript) {
      voiceTranscript.textContent = state.voiceTranscript;
      voiceTranscript.className = 'voice-transcript has-text';
    } else {
      voiceTranscript.textContent = 'WearGuard is preparing always-on voice safety monitoring...';
      voiceTranscript.className = 'voice-transcript live';
    }
    voiceHelper.textContent = 'Voice monitoring starts automatically and reconnects if the microphone session ends.';
    return;
  }

  voiceStateText.textContent = 'Paused';
  voiceListenBtn.innerHTML = '<i class="fas fa-microphone"></i> Resume listening';
  if (state.voiceTranscript) {
    voiceTranscript.textContent = state.voiceTranscript;
    voiceTranscript.className = 'voice-transcript has-text';
    voiceHelper.textContent = 'Voice monitoring is paused. Resume listening to keep Safety AI active.';
  } else {
    voiceTranscript.textContent = 'Voice safety monitoring is paused. Resume listening to let Safety AI analyse speech automatically.';
    voiceTranscript.className = 'voice-transcript placeholder';
    voiceHelper.textContent = 'Resume listening whenever you want WearGuard to start monitoring speech again.';
  }
}

function saveCodeWord() {
  const val = document.getElementById('codeWordInput').value.trim();
  if (!val) { showToast('Enter a code word first.', 'amber'); return; }
  state.codeWord = val;
  document.getElementById('codeWordInput').value = '';
  persistSettings();
  updateChips();
  showToast(`Code word saved. Safety AI will react to "${val}".`, 'amber');
  logEvent({ title: 'Code word saved', detail: 'Safety AI now responds to your private trigger phrase.', icon: 'fas fa-key', accent: '#F0A03A' });
}

/* â”€â”€ COUNTDOWN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function armCountdown() {
  autoSendAlert();
}

function cancelCountdown(silent) {
  if (!state.countdown) return;
  clearInterval(state.countdown.tickerId);
  state.countdown = null;
  document.getElementById('countdownBar').classList.remove('active');
  if (!silent) {
    state.conversation = 'routine';
    const aiEl = document.getElementById('aiResponse');
    aiEl.className = 'ai-response';
    aiEl.textContent = 'Alert cancelled. Safety AI has returned to routine monitoring.';
    updateBanner();
    showToast('Alert cancelled - glad you\'re safe.', 'teal');
    logEvent({ title: 'Alert cancelled', detail: 'User cancelled the danger countdown. Monitoring resumed.', icon: 'fas fa-circle-check', accent: '#198A73' });
  }
}

function autoSendAlert() {
  state.countdown = null;
  document.getElementById('countdownBar').classList.remove('active');
  if (!state.alertActive) {
    sendEmergencyAlert('Safety AI detected a dangerous conversation.', { source: 'safety-ai' });
  }
}

/* â”€â”€ EMERGENCY ALERT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function legacySendEmergencyAlertMock(reason, options) {
  if (state.alertActive) return;

  syncDeliveryConfigFromInputs();
  const cfg = options || {};
  const primary = state.contacts.find(c => c.primary) || state.contacts[0];
  if (!primary && !state.alertWebhookUrl) {
    showToast('Add a primary contact or emergency webhook first.', 'amber');
    logEvent({
      title: 'Emergency alert blocked',
      detail: 'No primary contact or alert webhook is configured yet.',
      icon: 'fas fa-circle-exclamation',
      accent: '#F0A03A',
    });
    return;
  }

  state.alertActive = true;
  setPanicUiState(true);
  updateBanner();

  let location = null;
  try {
    location = await getCurrentLocation();
  } catch (error) {
    location = null;
  }

  const payload = buildEmergencyPayload(reason, location, cfg.source || 'manual');
  const message = buildEmergencyMessage(payload);
  const webhookSent = state.alertWebhookUrl ? await postWebhook(state.alertWebhookUrl, payload) : false;
  const emailJsSent = primary
    ? await sendEmailViaEmailJs(primary, 'WearGuard Emergency Alert', message, payload)
    : false;
  const deliveredChannels = primary
    ? deliverToContact(primary, 'WearGuard Emergency Alert', message, {
        allowSms: true,
        allowCall: Boolean(cfg.allowCall),
        openAll: Boolean(cfg.openAllChannels),
        skipEmail: emailJsSent,
      })
    : [];
  const sentAny = webhookSent || emailJsSent || deliveredChannels.length > 0;

  if (!sentAny) {
    state.alertActive = false;
    setPanicUiState(false);
    updateBanner();
    showToast('No real delivery route is configured yet.', 'amber');
    logEvent({
      title: 'Emergency alert failed',
      detail: 'Add WhatsApp, email, phone, or an emergency webhook to send alerts.',
      icon: 'fas fa-triangle-exclamation',
      accent: '#F0A03A',
    });
    return;
  }

  const recipient = primary ? primary.name : 'configured webhook';
  logEvent({
    title: 'Emergency alert sent',
    detail: `${reason} Sent to ${recipient} with encrypted location and heart-rate snapshot.`,
    icon: 'fas fa-siren-on', accent: '#D65A3F',
  });
  updateBanner();
  showToast(`Emergency alert sent to ${recipient}.`, 'coral');

  const btn = document.getElementById('panicBtn');
  btn.classList.add('active');
  document.getElementById('panicBtnLabel').textContent = 'Alert Sent';
  document.getElementById('panicHint').textContent = 'Help is on the way. Tap again to cancel alert.';

  setTimeout(() => {
    state.alertActive = false;
    btn.classList.remove('active');
    document.getElementById('panicBtnLabel').textContent = 'Send Emergency Alert';
    document.getElementById('panicHint').textContent = 'Hold to confirm - sends to emergency contacts';
    state.conversation = 'routine';
    updateBanner();
  }, 8000);
}

function legacyHandlePanicMock(e) {
  // ripple
  const btn = e.currentTarget;
  const r = document.createElement('span');
  r.className = 'panic-ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);

  if (state.alertActive) {
    // cancel
    state.alertActive = false;
    btn.classList.remove('active');
    document.getElementById('panicBtnLabel').textContent = 'Send Emergency Alert';
    document.getElementById('panicHint').textContent = 'Hold to confirm - sends to emergency contacts';
    state.conversation = 'routine';
    updateBanner();
    showToast('Emergency alert cancelled.');
    logEvent({ title: 'Alert cancelled manually', detail: 'User cancelled the active emergency alert.', icon: 'fas fa-circle-xmark', accent: '#F0A03A' });
  } else {
    cancelCountdown(true);
    sendEmergencyAlert('Manual panic button pressed.');
  }
}

/* â”€â”€ HEART RATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function sendEmergencyAlert(reason, options) {
  if (state.alertActive) return;

  syncDeliveryConfigFromInputs();
  const cfg = options || {};
  const primary = state.contacts.find(c => c.primary) || state.contacts[0] || null;
  if (!primary && !state.alertWebhookUrl) {
    showToast('Add a primary contact or emergency webhook first.', 'amber');
    logEvent({
      title: 'Emergency alert blocked',
      detail: 'No primary contact or alert webhook is configured yet.',
      icon: 'fas fa-circle-exclamation',
      accent: '#F0A03A',
    });
    return;
  }

  state.alertActive = true;
  setPanicUiState(true);
  updateBanner();

  let location = null;
  try {
    location = await getCurrentLocation();
  } catch (error) {
    location = null;
  }

  const payload = buildEmergencyPayload(reason, location, cfg.source || 'manual');
  const message = buildEmergencyMessage(payload);
  const webhookSent = state.alertWebhookUrl ? await postWebhook(state.alertWebhookUrl, payload) : false;
  const emailJsExpected = isEmailJsPreferredForEmail(primary);
  const emailJsMissing = emailJsExpected && !canUseEmailJs();
  const emailJsSent = primary
    ? await sendEmailViaEmailJs(primary, 'WearGuard Emergency Alert', message, payload)
    : false;
  const deliveredChannels = primary
    ? deliverToContact(primary, 'WearGuard Emergency Alert', message, {
        allowSms: true,
        allowCall: Boolean(cfg.allowCall),
        openAll: Boolean(cfg.openAllChannels),
        skipEmail: emailJsExpected,
      })
    : [];
  const sentAny = webhookSent || emailJsSent || deliveredChannels.length > 0;

  if (!sentAny) {
    state.alertActive = false;
    setPanicUiState(false);
    updateBanner();
    showToast(emailJsMissing ? `EmailJS needs ${formatMissingFieldList(getEmailJsMissingFields())}.` : 'No real delivery route is configured yet.', 'amber');
    logEvent({
      title: 'Emergency alert failed',
      detail: emailJsMissing
        ? `EmailJS email is selected but missing ${formatMissingFieldList(getEmailJsMissingFields())}.`
        : 'Add WhatsApp, email, phone, or an emergency webhook to send alerts.',
      icon: 'fas fa-triangle-exclamation',
      accent: '#F0A03A',
    });
    return;
  }

  const recipient = primary ? primary.name : 'configured webhook';
  const channelSummary = [webhookSent ? 'webhook' : '', emailJsSent ? 'EmailJS' : '', ...deliveredChannels].filter(Boolean).join(', ');
  const locationSummary = location ? ` Location: ${formatLocationText(location)}.` : ' Location unavailable.';
  logEvent({
    title: 'Emergency alert sent',
    detail: `${reason} Delivered via ${channelSummary || 'configured route'} to ${recipient}.${locationSummary}`,
    icon: 'fas fa-siren-on',
    accent: '#D65A3F',
  });
  showToast(`Emergency alert sent via ${channelSummary || 'configured route'}.`, 'coral');
  updateBanner();

  setTimeout(() => {
    state.alertActive = false;
    setPanicUiState(false);
    state.conversation = 'routine';
    updateBanner();
  }, 8000);
}

function handlePanic(e) {
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  ripple.className = 'panic-ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);

  if (state.alertActive) {
    state.alertActive = false;
    setPanicUiState(false);
    state.conversation = 'routine';
    updateBanner();
    showToast('Emergency alert cancelled.');
    logEvent({
      title: 'Alert cancelled manually',
      detail: 'User cancelled the active emergency alert.',
      icon: 'fas fa-circle-xmark',
      accent: '#F0A03A',
    });
    return;
  }

  cancelCountdown(true);
  sendEmergencyAlert('Manual panic button pressed.', {
    source: 'panic-button',
    allowCall: true,
    openAllChannels: true,
  });
}

function simulateHighHR() {
  state.heartRate = 138 + Math.floor(Math.random() * 20);
  updateHRDisplay();
  logEvent({ title: 'High heart rate detected', detail: `${state.heartRate} BPM - stress event flagged.`, icon: 'fas fa-heartbeat', accent: '#D65A3F' });
  showToast(`Heart rate spike: ${state.heartRate} BPM`, 'coral');
  setTimeout(() => {
    state.heartRate = 72 + Math.floor(Math.random() * 20);
    updateHRDisplay();
  }, 6000);
}

function updateHRDisplay() {
  const high = state.heartRate >= 132;
  const pct = Math.min(100, Math.max(5, ((state.heartRate - 40) / 100) * 100));
  document.getElementById('hrNumber').textContent = state.heartRate;
  document.getElementById('hrNumber').className = 'hr-number' + (high ? ' high' : '');
  const bar = document.getElementById('hrBar');
  bar.style.width = pct + '%';
  bar.className = 'hr-bar' + (high ? ' high' : '');
  document.getElementById('hrChipVal').textContent = state.heartRate + ' BPM';
  document.getElementById('hrChip').querySelector('i').style.color = high ? '#D65A3F' : '#F0A03A';
}

/* â”€â”€ CONTACTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function addContact() {
  const name     = document.getElementById('contactNameInput').value.trim();
  const phone    = document.getElementById('contactPhoneInput').value.trim();
  const whatsapp = document.getElementById('contactWhatsAppInput').value.trim();
  const email    = document.getElementById('contactEmailInput').value.trim();

  if (!name)  { showToast('Enter a contact name.', 'amber'); return; }
  if (!phone && !whatsapp && !email) { showToast('Add at least a phone, WhatsApp, or email.', 'amber'); return; }

  const isPrimary = state.contacts.length === 0;
  state.contacts.push({ id: Date.now(), name, phone, whatsapp, email, primary: isPrimary });

  document.getElementById('contactNameInput').value     = '';
  document.getElementById('contactPhoneInput').value    = '';
  document.getElementById('contactWhatsAppInput').value = '';
  document.getElementById('contactEmailInput').value    = '';

  persistSettings();
  renderContacts();
  updateChips();
  updateShareContactSelect();
  showToast(`${name} added${isPrimary ? ' as primary contact' : ''}.`);
  logEvent({ title: 'Contact added', detail: `${name} joined your emergency circle.`, icon: 'fas fa-user-plus', accent: '#198A73' });
}

function removeContact(id) {
  state.contacts = state.contacts.filter(c => c.id !== id);
  if (state.contacts.length && !state.contacts.some(c => c.primary)) {
    state.contacts[0].primary = true;
  }
  persistSettings();
  renderContacts();
  updateChips();
  updateShareContactSelect();
}

function setPrimary(id) {
  state.contacts.forEach(c => c.primary = (c.id === id));
  persistSettings();
  renderContacts();
  showToast('Primary contact updated.');
}

function renderContacts() {
  const ul = document.getElementById('contactsList');
  ul.innerHTML = '';
  if (!state.contacts.length) {
    ul.innerHTML = '<li style="color:rgba(22,59,53,.4);font-size:12px;font-weight:500;justify-content:center;">No contacts yet - add one above.</li>';
    return;
  }
  state.contacts.forEach(c => {
    const li = document.createElement('li');
    const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const detail = [c.phone, c.whatsapp ? `WA: ${c.whatsapp}` : '', c.email].filter(Boolean).join(' - ');
    li.innerHTML = `
      <div class="contact-avatar ${c.primary ? 'primary' : ''}">${initials}</div>
      <div class="contact-info">
        <div class="contact-name">${c.name} <span class="primary-badge ${c.primary ? 'show' : ''}">Primary</span></div>
        <div class="contact-detail">${detail || 'No details'}</div>
      </div>
      <div class="contact-actions">
        <button class="icon-btn star ${c.primary ? 'active' : ''}" title="Set as primary" onclick="setPrimary(${c.id})">
          <i class="fas fa-star"></i>
        </button>
        <button class="icon-btn del" title="Remove" onclick="removeContact(${c.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
    ul.appendChild(li);
  });
}

function updateShareContactSelect() {
  const sel = document.getElementById('shareContactSelect');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Select contact to share with</option>';
  state.contacts.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  sel.value = prev;
}

/* â”€â”€ LOCATION SHARING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function legacyStartLocationShareMock() {
  const cid = document.getElementById('shareContactSelect').value;
  const mins = parseInt(document.getElementById('shareDurationSelect').value);
  if (!cid) { showToast('Select a contact to share with.', 'amber'); return; }
  const contact = state.contacts.find(c => c.id == cid);
  if (!contact) return;

  if (state.locationTimer) clearInterval(state.locationTimer);
  state.locationSharing = true;
  state.locationContact = contact.name;

  const end = Date.now() + mins * 60 * 1000;
  updateShareStatus(true, `Sharing with ${contact.name} - ends in ${mins}m`);

  state.locationTimer = setInterval(() => {
    const rem = end - Date.now();
    if (rem <= 0) { stopLocationShare(true); return; }
    const m = Math.ceil(rem / 60000);
    updateShareStatus(true, `Sharing with ${contact.name} - ${m}m remaining`);
  }, 15000);

  showToast(`Location sharing started with ${contact.name} for ${mins} min.`);
  logEvent({ title: 'Location sharing started', detail: `Live location sent to ${contact.name} for ${mins} minutes.`, icon: 'fas fa-location-arrow', accent: '#198A73' });
}

function legacyStopLocationShareMock(auto) {
  if (state.locationTimer) clearInterval(state.locationTimer);
  state.locationSharing = false;
  state.locationTimer = null;
  updateShareStatus(false, 'Location sharing is off.');
  if (!auto) {
    showToast('Location sharing stopped.');
    logEvent({ title: 'Location sharing stopped', detail: 'Live location sharing ended by user.', icon: 'fas fa-location-crosshairs', accent: '#F0A03A' });
  } else {
    showToast('Location sharing expired.');
    logEvent({ title: 'Location sharing expired', detail: `Sharing session with ${state.locationContact} ended.`, icon: 'fas fa-clock', accent: '#F0A03A' });
  }
}

function legacySendLocationNowMock() {
  const cid = document.getElementById('shareContactSelect').value;
  if (!cid) { showToast('Select a contact first.', 'amber'); return; }
  const contact = state.contacts.find(c => c.id == cid);
  if (!contact) return;
  showToast(`Location snapshot sent to ${contact.name}.`);
  logEvent({ title: 'Location sent', detail: `One-time location shared with ${contact.name}.`, icon: 'fas fa-paper-plane', accent: '#198A73' });
}

async function sendLocationPayload(contact, context, options) {
  syncDeliveryConfigFromInputs();
  const cfg = options || {};
  const location = cfg.location || await getCurrentLocation();
  const payload = buildLocationPayload(contact, location, context || {});
  const message = buildLocationMessage(contact, payload);
  const webhookUrl = cfg.webhookUrl || state.locationWebhookUrl;
  const webhookSent = webhookUrl ? await postWebhook(webhookUrl, payload) : false;
  const emailJsExpected = isEmailJsPreferredForEmail(contact);
  const emailJsMissing = emailJsExpected && !canUseEmailJs();
  const emailJsSent = contact
    ? await sendEmailViaEmailJs(contact, 'WearGuard Location Update', message, payload)
    : false;
  const deliveredChannels = cfg.openRoutes && contact
    ? deliverToContact(contact, 'WearGuard Location Update', message, {
        allowSms: true,
        allowCall: false,
        openAll: Boolean(cfg.openAllChannels),
        skipEmail: emailJsExpected,
      })
    : [];

  return {
    location,
    payload,
    webhookSent,
    emailJsMissing,
    emailJsSent,
    deliveredChannels,
    sentAny: webhookSent || emailJsSent || deliveredChannels.length > 0,
  };
}

function clearLocationShareSession() {
  if (state.locationTimer) clearInterval(state.locationTimer);
  if (state.locationWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(state.locationWatchId);
  }

  state.locationTimer = null;
  state.locationWatchId = null;
  state.locationShareEndsAt = null;
  state.lastLocationSentAt = 0;
  state.locationSharing = false;
}

async function startLocationShare() {
  syncDeliveryConfigFromInputs();
  const cid = document.getElementById('shareContactSelect').value;
  const mins = parseInt(document.getElementById('shareDurationSelect').value, 10);
  if (!cid) { showToast('Select a contact to share with.', 'amber'); return; }

  const contact = state.contacts.find(c => c.id == cid);
  if (!contact) return;
  if (!hasReachableContactRoute(contact) && !state.locationWebhookUrl) {
    showToast('Add contact details or a live location webhook first.', 'amber');
    return;
  }

  clearLocationShareSession();
  state.locationSharing = true;
  state.locationContact = contact.name;
  state.locationShareEndsAt = Date.now() + mins * 60 * 1000;
  updateShareStatus(true, `Getting live GPS for ${contact.name}...`);

  let initialResult;
  try {
    initialResult = await sendLocationPayload(contact, {
      mode: 'start',
      reason: `Live location sharing started for ${mins} minutes.`,
      minutes: mins,
    }, {
      openRoutes: true,
      webhookUrl: state.locationWebhookUrl,
    });
  } catch (error) {
    clearLocationShareSession();
    updateShareStatus(false, 'Location sharing is off.');
    showToast(getLocationErrorMessage(error), 'amber');
    logEvent({
      title: 'Location sharing failed',
      detail: getLocationErrorMessage(error),
      icon: 'fas fa-location-crosshairs',
      accent: '#F0A03A',
    });
    return;
  }

  if (!initialResult.sentAny) {
    clearLocationShareSession();
    updateShareStatus(false, 'Location sharing is off.');
    showToast(initialResult.emailJsMissing ? `EmailJS needs ${formatMissingFieldList(getEmailJsMissingFields())}.` : 'No real delivery route is configured yet.', 'amber');
    return;
  }

  state.lastLocationSentAt = Date.now();
  const startSummary = [initialResult.webhookSent ? 'webhook' : '', initialResult.emailJsSent ? 'EmailJS' : '', ...initialResult.deliveredChannels].filter(Boolean).join(', ');
  const continuousNote = state.locationWebhookUrl
    ? 'continuous webhook updates active'
    : 'initial location sent; add a webhook for continuous background updates';
  updateShareStatus(true, `Sharing with ${contact.name} - ${continuousNote}`);
  showToast(`Location sent via ${startSummary || 'configured route'}.`, 'teal');
  logEvent({
    title: 'Location sharing started',
    detail: `Real location sent to ${contact.name}. ${continuousNote}.`,
    icon: 'fas fa-location-arrow',
    accent: '#198A73',
  });

  state.locationTimer = setInterval(() => {
    const rem = state.locationShareEndsAt - Date.now();
    if (rem <= 0) {
      stopLocationShare(true);
      return;
    }

    const minsRemaining = Math.max(1, Math.ceil(rem / 60000));
    const suffix = state.locationWebhookUrl ? `${minsRemaining}m remaining` : `waiting for manual sends - ${minsRemaining}m left`;
    updateShareStatus(true, `Sharing with ${contact.name} - ${suffix}`);
  }, 15000);

  if (!navigator.geolocation) return;

  state.locationWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      if (!state.locationSharing || !state.locationWebhookUrl) return;

      const now = Date.now();
      if (now - state.lastLocationSentAt < LOCATION_UPDATE_INTERVAL_MS) return;

      state.lastLocationSentAt = now;
      const location = positionToLocation(position);
      const sent = await postWebhook(state.locationWebhookUrl, buildLocationPayload(contact, location, {
        mode: 'live',
        reason: 'Background live location update.',
        minutes: mins,
      }));

      updateShareStatus(
        true,
        sent
          ? `Sharing with ${contact.name} - live update sent ${formatTime(new Date())}`
          : `Sharing with ${contact.name} - webhook update failed`
      );
    },
    (error) => {
      updateShareStatus(true, `Sharing with ${contact.name} - ${getLocationErrorMessage(error)}`);
      showToast(getLocationErrorMessage(error), 'amber');
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
  );
}

function stopLocationShare(auto) {
  const previousContact = state.locationContact;
  clearLocationShareSession();
  state.locationContact = null;
  updateShareStatus(false, 'Location sharing is off.');

  if (!auto) {
    showToast('Location sharing stopped.');
    logEvent({
      title: 'Location sharing stopped',
      detail: `Live location sharing ended for ${previousContact || 'your contact'}.`,
      icon: 'fas fa-location-crosshairs',
      accent: '#F0A03A',
    });
  } else if (previousContact) {
    showToast('Location sharing expired.');
    logEvent({
      title: 'Location sharing expired',
      detail: `Sharing session with ${previousContact} ended.`,
      icon: 'fas fa-clock',
      accent: '#F0A03A',
    });
  }
}

async function sendLocationNow() {
  syncDeliveryConfigFromInputs();
  const cid = document.getElementById('shareContactSelect').value;
  if (!cid) { showToast('Select a contact first.', 'amber'); return; }

  const contact = state.contacts.find(c => c.id == cid);
  if (!contact) return;
  if (!hasReachableContactRoute(contact) && !state.locationWebhookUrl) {
    showToast('Add contact details or a live location webhook first.', 'amber');
    return;
  }

  try {
    const result = await sendLocationPayload(contact, {
      mode: 'single',
      reason: 'One-time live location update.',
      minutes: 0,
    }, {
      openRoutes: true,
      webhookUrl: state.locationWebhookUrl,
    });

    if (!result.sentAny) {
      showToast(result.emailJsMissing ? `EmailJS needs ${formatMissingFieldList(getEmailJsMissingFields())}.` : 'No real delivery route is configured yet.', 'amber');
      return;
    }

    const channelSummary = [result.webhookSent ? 'webhook' : '', result.emailJsSent ? 'EmailJS' : '', ...result.deliveredChannels].filter(Boolean).join(', ');
    showToast(`Location sent via ${channelSummary || 'configured route'}.`, 'teal');
    logEvent({
      title: 'Location sent',
      detail: `Real location delivered to ${contact.name} via ${channelSummary || 'configured route'}.`,
      icon: 'fas fa-paper-plane',
      accent: '#198A73',
    });
  } catch (error) {
    showToast(getLocationErrorMessage(error), 'amber');
    logEvent({
      title: 'Location send failed',
      detail: getLocationErrorMessage(error),
      icon: 'fas fa-location-crosshairs',
      accent: '#F0A03A',
    });
  }
}

function updateShareStatus(active, text) {
  document.getElementById('shareStatusText').textContent = text;
  document.getElementById('shareDot').className = 'share-dot' + (active ? ' active' : '');
}

/* â”€â”€ BANNER & CHIPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function updateBanner() {
  const banner = document.getElementById('statusBanner');
  const icon   = document.getElementById('bannerIcon');
  const label  = document.getElementById('bannerLabel');
  const text   = document.getElementById('bannerText');
  banner.className = 'status-banner';

  if (state.alertActive) {
    banner.classList.add('danger');
    icon.innerHTML  = '<i class="fas fa-siren-on"></i>';
    label.textContent = 'ALERT ACTIVE';
    text.textContent  = 'Emergency alert has been sent. Help is on the way.';
  } else if (state.conversation === 'danger') {
    banner.classList.add('danger');
    icon.innerHTML  = '<i class="fas fa-triangle-exclamation"></i>';
    label.textContent = 'DANGER DETECTED';
    text.textContent  = 'AI detected danger signals. Emergency alerts are dispatched immediately.';
  } else if (state.conversation === 'concern') {
    banner.classList.add('concern');
    icon.innerHTML  = '<i class="fas fa-circle-exclamation"></i>';
    label.textContent = 'CONCERN DETECTED';
    text.textContent  = 'Safety AI is on elevated watch. Tap panic button if you need help.';
  } else {
    icon.innerHTML  = '<i class="fas fa-shield-halved"></i>';
    label.textContent = 'ALL CLEAR';
    text.textContent  = 'Monitoring active. Heart rate and AI safety systems are running.';
  }
}

function updateChips() {
  const n = state.contacts.length;
  document.getElementById('contactChipVal').textContent = n === 0 ? 'No contacts' : n === 1 ? '1 contact' : `${n} contacts`;
  document.getElementById('codeChipVal').textContent = state.codeWord ? 'Code word set' : 'No code word';
}

/* â”€â”€ EVENT LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function logEvent({ title, detail, icon, accent }) {
  state.events.unshift({ title, detail, icon, accent, time: new Date() });
  if (state.events.length > 8) state.events.length = 8;
  renderEvents();
}

function renderEvents() {
  const list = document.getElementById('eventList');
  list.innerHTML = state.events.map(ev => `
    <div class="event-row">
      <div class="event-icon-wrap" style="background:${accent20(ev.accent)};color:${ev.accent}">
        <i class="${ev.icon}"></i>
      </div>
      <div class="event-body">
        <div class="event-title">${ev.title}</div>
        <div class="event-detail">${ev.detail}</div>
        <div class="event-time">${formatTime(ev.time)}</div>
      </div>
    </div>`).join('');
}

function accent20(hex) {
  return hex + '22';
}

function formatTime(d) {
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* â”€â”€ CARD TOGGLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toggleCard(id) {
  document.getElementById(id).classList.toggle('open');
}

/* â”€â”€ TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function showToast(msg, type) {
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast' + (
    type === 'teal' ? ' teal' :
    type === 'amber' ? ' amber' :
    type === 'coral' ? ' coral' : ''
  );
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* â”€â”€ RENDER ALL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function renderAll() {
  updateHRDisplay();
  updateBanner();
  updateChips();
  updateVoiceUI();
  renderContacts();
  updateShareContactSelect();
  renderEvents();
  updateDeviceAccessUi();
}
