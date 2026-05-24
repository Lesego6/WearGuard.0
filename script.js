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
  storageKey: '',
  storageCryptoKeyPromise: null,
  security: createDefaultSecurityState(),
  wearable: {
    bluetoothSupported: false,
    secureContext: false,
    status: 'disconnected', // disconnected | scanning | selecting | pairing | syncing | connected | error
    message: '',
    availableDevices: [],
    connectedDevice: null,
    lastPairedDevice: null,
    source: 'standby',
    batteryLevel: null,
    signalStrength: null,
    lastSyncAt: null,
    scanTimerId: null,
    stageTimerIds: [],
    telemetryTimerId: null,
    realDevice: null,
    suppressDisconnectEvent: false,
  },
};

const DANGER_SIGNALS  = ['help','danger','unsafe','attack','followed','hurt','trapped','panic','emergency','stalker',"can't breathe","dont feel safe","do not feel safe","i need help","please help"];
const CONCERN_SIGNALS = ['worried','nervous','anxious','late','check in','check-in','lost','tense','something feels off','uncomfortable','uneasy'];
const STORAGE_KEY = 'wearguard-settings-v2';
const WEARABLE_DEVICE_KEY = 'wearguard-last-watch-v1';
const SESSION_ENDPOINT = '/api/session';
const DISPATCH_ENDPOINT = '/api/dispatch';
const DEV_LOCAL_SESSION_KEY = 'wearguard-local-dev-session-v1';
const LOCATION_UPDATE_INTERVAL_MS = 60 * 1000;
const VOICE_RESTART_DELAY_MS = 900;
const WEARABLE_TELEMETRY_INTERVAL_MS = 4200;
const DEMO_WEARABLES = [
  {
    id: 'sentinel-s3',
    name: 'Sentinel S3',
    profile: 'Heart rate + fall detection',
    batteryLevel: 92,
    signalStrength: 'Strong',
    restingHeartRate: 78,
  },
  {
    id: 'halo-mini',
    name: 'Halo Mini',
    profile: 'Heart rate + stress sampling',
    batteryLevel: 71,
    signalStrength: 'Good',
    restingHeartRate: 82,
  },
  {
    id: 'luna-sport',
    name: 'Luna Sport',
    profile: 'Heart rate + workout stream',
    batteryLevel: 58,
    signalStrength: 'Fair',
    restingHeartRate: 88,
  },
];
const REMOVED_AUTO_CONTACT = {
  id: 2040793019099,
  name: 'Lesego Moeng',
  phone: '',
  whatsapp: '0793019099',
  email: 'lesegomoeng0204@gmail.con',
};

const SECURITY_SCALE = {
  low: { label: 'Low', weight: 1 },
  moderate: { label: 'Moderate', weight: 2 },
  high: { label: 'High', weight: 3 },
  critical: { label: 'Critical', weight: 4 },
};

const SECURITY_THREAT_CATALOG = [
  {
    id: 'unauthorizedAccess',
    title: 'Unauthorized access to secure workflows',
    detail: 'Review sign-in, remembered sessions, and local-development bypass behavior as a trust boundary.',
    mitigation: 'Use strong identity, rate limiting, and deployment secrets before production rollout.',
  },
  {
    id: 'wearableSpoofing',
    title: 'Spoofed or tampered wearable telemetry',
    detail: 'Confirm how a paired watch is trusted before heart-rate data can influence panic or monitoring flows.',
    mitigation: 'Only trust Bluetooth sessions in secure contexts and clearly separate demo devices from real wearables.',
  },
  {
    id: 'localDataExposure',
    title: 'Local exposure of contacts and code words',
    detail: 'Map when sensitive browser storage becomes available and what an attacker could read after session compromise.',
    mitigation: 'Keep retained data minimal, encrypted against the active session key, and review retention carefully.',
  },
  {
    id: 'alertRelayAbuse',
    title: 'Alert relay abuse or delivery downgrade',
    detail: 'Assess how emergency dispatch behaves when secure relay is unavailable or downstream webhooks trust too much.',
    mitigation: 'Prefer authenticated relay in production and rate-limit alert dispatch to downstream integrations.',
  },
  {
    id: 'permissionMisuse',
    title: 'Over-privileged browser permissions',
    detail: 'Check that Bluetooth, microphone, and location prompts are only requested when the user intentionally enables them.',
    mitigation: 'Keep permission requests contextual and make denied permissions degrade safely.',
  },
];

const SECURITY_CODING_REVIEW_ITEMS = [
  {
    id: 'inputValidation',
    title: 'Input validation reviewed',
    detail: 'User-entered names, emails, contacts, and review fields should be normalized before use or storage.',
  },
  {
    id: 'safeRendering',
    title: 'Unsafe HTML injection removed',
    detail: 'Dynamic platform content should render through DOM APIs instead of writing raw HTML strings.',
  },
  {
    id: 'secretHandling',
    title: 'Secrets kept out of client code',
    detail: 'Environment values and webhook secrets should stay on the server or deployment platform.',
  },
  {
    id: 'authHardening',
    title: 'Authentication and session flow reviewed',
    detail: 'Session creation, remember-device behavior, and local exceptions should have explicit owner approval.',
  },
  {
    id: 'dependencyConfig',
    title: 'Dependency and configuration review completed',
    detail: 'Confirm deployment headers, environment variables, and any third-party services before release.',
  },
];

const SECURITY_INTEGRATION_REVIEW_ITEMS = [
  {
    id: 'sessionDeployment',
    title: 'Session deployment reviewed',
    detail: 'Validate cookies, environment variables, and the behavior of local-development fallbacks.',
  },
  {
    id: 'alertRelay',
    title: 'Alert relay and downstream webhook reviewed',
    detail: 'Confirm authenticated delivery, rate limits, and incident ownership for real alert integrations.',
  },
  {
    id: 'permissionJourneys',
    title: 'Permission journeys tested',
    detail: 'Walk through Bluetooth, microphone, and location prompts on the target browsers and devices.',
  },
  {
    id: 'dataRetention',
    title: 'Data retention and privacy reviewed',
    detail: 'Document what contacts, code words, and review notes are stored and when they should be removed.',
  },
];

function createDefaultSecurityState() {
  return {
    owner: '',
    reviewDate: '',
    scope: 'pilot',
    exposure: 'moderate',
    dataSensitivity: 'high',
    integrationCriticality: 'high',
    attackSurface: 'moderate',
    designReviewNotes: 'Review auth flow, wearable trust boundaries, data retention, and alert delivery downgrade paths before release.',
    integrationNotes: 'Validate session cookies, permission prompts, secure relay, and browser storage behavior in the target deployment.',
    threatReviews: normalizeChecklistValues(SECURITY_THREAT_CATALOG, {}),
    secureCodingReviews: normalizeChecklistValues(SECURITY_CODING_REVIEW_ITEMS, {
      inputValidation: true,
      safeRendering: true,
      secretHandling: true,
      authHardening: true,
      dependencyConfig: false,
    }),
    integrationReviews: normalizeChecklistValues(SECURITY_INTEGRATION_REVIEW_ITEMS, {
      sessionDeployment: true,
      alertRelay: false,
      permissionJourneys: true,
      dataRetention: false,
    }),
    testing: {
      lastRunAt: '',
      findings: [],
      passCount: 0,
      warnCount: 0,
      failCount: 0,
    },
  };
}

function normalizeChecklistValues(items, values) {
  const source = values && typeof values === 'object' ? values : {};
  return items.reduce((result, item) => {
    result[item.id] = Boolean(source[item.id]);
    return result;
  }, {});
}

function normalizeSecurityFinding(value) {
  if (!value || typeof value !== 'object') return null;

  const status = ['pass', 'warn', 'fail'].includes(value.status) ? value.status : 'warn';
  const title = String(value.title || '').trim();
  const detail = String(value.detail || '').trim();
  if (!title || !detail) return null;

  return { status, title, detail };
}

function normalizeSecurityState(value) {
  const defaults = createDefaultSecurityState();
  const source = value && typeof value === 'object' ? value : {};
  const testingSource = source.testing && typeof source.testing === 'object' ? source.testing : {};
  const normalizedFindings = Array.isArray(testingSource.findings)
    ? testingSource.findings.map(normalizeSecurityFinding).filter(Boolean)
    : [];

  return {
    owner: String(source.owner || '').trim(),
    reviewDate: String(source.reviewDate || '').trim(),
    scope: ['prototype', 'pilot', 'production'].includes(source.scope) ? source.scope : defaults.scope,
    exposure: SECURITY_SCALE[source.exposure] ? source.exposure : defaults.exposure,
    dataSensitivity: SECURITY_SCALE[source.dataSensitivity] ? source.dataSensitivity : defaults.dataSensitivity,
    integrationCriticality: SECURITY_SCALE[source.integrationCriticality] ? source.integrationCriticality : defaults.integrationCriticality,
    attackSurface: SECURITY_SCALE[source.attackSurface] ? source.attackSurface : defaults.attackSurface,
    designReviewNotes: typeof source.designReviewNotes === 'string' ? source.designReviewNotes.trim() : defaults.designReviewNotes,
    integrationNotes: typeof source.integrationNotes === 'string' ? source.integrationNotes.trim() : defaults.integrationNotes,
    threatReviews: normalizeChecklistValues(SECURITY_THREAT_CATALOG, source.threatReviews || defaults.threatReviews),
    secureCodingReviews: normalizeChecklistValues(SECURITY_CODING_REVIEW_ITEMS, source.secureCodingReviews || defaults.secureCodingReviews),
    integrationReviews: normalizeChecklistValues(SECURITY_INTEGRATION_REVIEW_ITEMS, source.integrationReviews || defaults.integrationReviews),
    testing: {
      lastRunAt: String(testingSource.lastRunAt || '').trim(),
      findings: normalizedFindings,
      passCount: Number.isFinite(Number(testingSource.passCount)) ? Math.max(0, Number(testingSource.passCount)) : normalizedFindings.filter((finding) => finding.status === 'pass').length,
      warnCount: Number.isFinite(Number(testingSource.warnCount)) ? Math.max(0, Number(testingSource.warnCount)) : normalizedFindings.filter((finding) => finding.status === 'warn').length,
      failCount: Number.isFinite(Number(testingSource.failCount)) ? Math.max(0, Number(testingSource.failCount)) : normalizedFindings.filter((finding) => finding.status === 'fail').length,
    },
  };
}

/* â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
window.addEventListener('DOMContentLoaded', () => {
  bindAuthForm();
  bindUiActions();
  initWearableBridge();
  setAuthStatus('Checking secure session...', '');
  renderAll();
  initializeApp();
});

async function initializeApp() {
  const sessionRestored = await restoreServerSession();
  if (sessionRestored) {
    await restoreProtectedState();
    setAuthStatus('Secure session restored.', 'success');
    unlockWearGuard({ silent: true, skipToast: true });
    return;
  }

  clearProtectedRuntimeState();
  lockWearGuard();
  renderAll();
}

function bootWearGuard() {
  if (!state.booted) {
    logEvent({
      title: 'Emergency mode ready',
      detail: 'WearGuard is unlocked. Pair a Bluetooth watch to stream live heart-rate data and keep Safety AI standing by.',
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

function bindUiActions() {
  const cardHeaders = document.querySelectorAll('[data-card-target]');
  cardHeaders.forEach((header) => {
    if (header.dataset.bound === 'true') return;

    const toggle = () => toggleCard(header.getAttribute('data-card-target'));
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
    header.dataset.bound = 'true';
  });

  bindClick('wearableConnectBtn', () => startWearableConnection());
  bindClick('wearableDisconnectBtn', () => disconnectWearable(true));
  bindClick('hrSimBtn', () => simulateHighHR());
  bindClick('voiceListenBtn', () => toggleVoiceRecognition());
  bindClick('voiceClearBtn', () => clearVoiceTranscript());
  bindClick('codeSaveBtn', () => saveCodeWord());
  bindClick('countdownCancelBtn', () => cancelCountdown());
  bindClick('addContactBtn', () => addContact());
  bindClick('startShareBtn', () => startLocationShare());
  bindClick('stopShareBtn', () => stopLocationShare());
  bindClick('sendShareNowBtn', () => sendLocationNow());
  bindClick('forgetDeviceBtn', () => forgetTrustedDevice());
  bindClick('panicBtn', (event) => handlePanic(event));

  const contactsList = document.getElementById('contactsList');
  if (contactsList && contactsList.dataset.bound !== 'true') {
    contactsList.addEventListener('click', handleContactsListClick);
    contactsList.dataset.bound = 'true';
  }

  bindSecurityPanel();
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (!element || element.dataset.bound === 'true') return;
  element.addEventListener('click', handler);
  element.dataset.bound = 'true';
}

function bindSecurityPanel() {
  const panel = document.getElementById('cardSecurity');
  if (!panel || panel.dataset.bound === 'true') return;

  panel.addEventListener('input', handleSecurityPanelInput);
  panel.addEventListener('change', handleSecurityPanelChange);
  panel.addEventListener('click', handleSecurityPanelClick);
  panel.dataset.bound = 'true';
}

function handleSecurityPanelInput(event) {
  const target = event.target;
  if (!target || !target.id) return;

  if (target.id === 'securityOwnerInput') {
    state.security.owner = target.value.trim();
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityDesignNotesInput') {
    state.security.designReviewNotes = target.value.trim();
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityIntegrationNotesInput') {
    state.security.integrationNotes = target.value.trim();
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
  }
}

function handleSecurityPanelChange(event) {
  const target = event.target;
  if (!target) return;

  if (target.matches('[data-security-toggle][data-security-id]')) {
    const group = target.getAttribute('data-security-toggle');
    const itemId = target.getAttribute('data-security-id');
    const reviewMap = getSecurityReviewMap(group);
    if (!reviewMap || !itemId) return;

    reviewMap[itemId] = Boolean(target.checked);
    persistSettings();
    renderSecurityOverview();
    renderSecurityChecklists();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityReviewDateInput') {
    state.security.reviewDate = target.value.trim();
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityScopeSelect') {
    state.security.scope = target.value;
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityExposureSelect') {
    state.security.exposure = target.value;
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityDataSelect') {
    state.security.dataSensitivity = target.value;
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securityIntegrationSelect') {
    state.security.integrationCriticality = target.value;
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
    return;
  }

  if (target.id === 'securitySurfaceSelect') {
    state.security.attackSurface = target.value;
    persistSettings();
    renderSecurityOverview();
    renderSecurityAssessmentSummary();
  }
}

function handleSecurityPanelClick(event) {
  const trigger = event.target.closest('button');
  if (!trigger) return;

  if (trigger.id === 'runSecurityReviewBtn') {
    runSecurityReview();
    return;
  }

  if (trigger.id === 'securitySnapshotBtn') {
    renderSecurityModule();
    persistSettings();
    showToast('Security assessment snapshot refreshed.', 'teal');
    logEvent({
      title: 'Security snapshot refreshed',
      detail: 'Security requirements, testing results, and integration posture were refreshed.',
      icon: 'fas fa-check-circle',
      accent: '#198A73',
    });
  }
}

async function handleDeviceLogin(event) {
  event.preventDefault();

  const nameInput = document.getElementById('authNameInput');
  const emailInput = document.getElementById('authEmailInput');
  const rememberInput = document.getElementById('authRememberInput');
  const honeypotInput = document.getElementById('authWebsiteInput');
  const submitBtn = document.getElementById('authSubmitBtn');

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

  if (submitBtn) submitBtn.disabled = true;
  setAuthStatus('Signing in securely...', '');

  try {
    const session = await apiRequest(SESSION_ENDPOINT, {
      method: 'POST',
      body: {
        name,
        email,
        remember,
        honeypot: honeypotValue,
      },
    });

    if (!isValidSessionPayload(session)) {
      throw new Error('Local session endpoint returned an invalid response.');
    }

    applyServerSession(session);
    if (isLocalDevelopmentHost()) {
      persistLocalDevelopmentSession(session);
    }
    await restoreProtectedState();
    setAuthStatus(remember ? 'Secure device session saved.' : 'Secure session opened.', 'success');
    unlockWearGuard({ silent: true });
    showToast(remember ? 'Secure session saved for this device.' : 'Secure session opened.', 'teal');
  } catch (error) {
    if (isLocalDevelopmentHost() && shouldUseLocalDevelopmentSession(error)) {
      const session = createLocalDevelopmentSession({ name, email }, remember);
      persistLocalDevelopmentSession(session);
      applyServerSession(session);
      await restoreProtectedState();
      setAuthStatus(remember ? 'Local dev session saved.' : 'Local dev session opened.', 'success');
      unlockWearGuard({ silent: true });
      showToast(remember ? 'Local dev session saved for this device.' : 'Local dev session opened.', 'teal');
      logEvent({
        title: 'Local development access granted',
        detail: remember ? `${name} opened a remembered localhost development session.` : `${name} opened a session-only localhost development session.`,
        icon: 'fas fa-user-shield',
        accent: '#198A73',
      });
      return;
    }

    setAuthStatus(error.message || 'Secure sign-in failed.', 'error');
    return;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }

  logEvent({
    title: 'Device access granted',
    detail: remember ? `${name} opened a remembered secure session on this browser.` : `${name} signed in with a session-only secure token.`,
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
    setAuthStatus('Secure session active.', 'success');
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

async function forgetTrustedDevice() {
  await clearServerSession();
  disconnectWearable(false);
  clearProtectedRuntimeState();
  clearAuthForm();
  lockWearGuard();
  renderAll();
  setAuthStatus('Secure session cleared. Sign in again to continue.', '');
  showToast('Secure session cleared. Sign in again to continue.', 'amber');
  logEvent({
    title: 'Secure session removed',
    detail: 'WearGuard will ask you to sign in again on this browser.',
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
    title.textContent = 'Secure device session is remembered.';
    text.textContent = `WearGuard will restore a signed server session for ${state.authProfile.name} on this browser until you sign out or the session expires.`;
    forgetBtn.disabled = false;
    return;
  }

  if (state.authProfile) {
    title.textContent = 'Session-only access is active.';
    text.textContent = `WearGuard is unlocked for ${state.authProfile.name} during this browser session only.`;
    forgetBtn.disabled = false;
    return;
  }

  title.textContent = 'No secure session is active.';
  text.textContent = 'Sign in and keep remember enabled if you want the server to restore this browser session next time.';
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

function normalizeAuthProfile(value) {
  if (!value || typeof value !== 'object') return null;
  const name = String(value.name || '').trim();
  const email = String(value.email || '').trim().toLowerCase();
  if (!name || !isValidEmail(email)) return null;
  return { name, email };
}

function setStorageKey(key) {
  state.storageKey = String(key || '');
  state.storageCryptoKeyPromise = null;
}

function isLocalDevelopmentHost() {
  if (window.location.protocol === 'file:') return true;

  if (window.location.protocol === 'http:' && window.location.port) {
    return true;
  }

  const host = String(window.location.hostname || '').toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host === '0.0.0.0' || host === '[::1]' || host.endsWith('.local') || host.endsWith('.localhost')) {
    return true;
  }

  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  return false;
}

function shouldUseLocalDevelopmentSession(error) {
  if (!error) return true;
  if (error.message === 'Local session endpoint returned an invalid response.') return true;
  if (!error.status) return true;

  const hasExplicitServerMessage = Boolean(error.payload && error.payload.error);
  if (hasExplicitServerMessage && [400, 401, 403].includes(error.status)) {
    return false;
  }

  if (!hasExplicitServerMessage && error.message === 'Request failed.') {
    return true;
  }

  return error.status === 404 || error.status === 405 || error.status >= 500;
}

function isValidSessionPayload(payload) {
  return Boolean(
    normalizeAuthProfile(payload && payload.profile) &&
    payload &&
    typeof payload.storageKey === 'string' &&
    payload.storageKey
  );
}

function createLocalDevelopmentSession(profile, remember) {
  const normalizedProfile = normalizeAuthProfile(profile);
  if (!normalizedProfile) return null;

  return {
    ok: true,
    authenticated: true,
    profile: normalizedProfile,
    remembered: Boolean(remember),
    storageKey: `wearguard-local-dev:${normalizedProfile.email}`,
    localDevelopment: true,
  };
}

function persistLocalDevelopmentSession(sessionPayload) {
  if (!sessionPayload || !sessionPayload.profile) return;

  const storage = sessionPayload.remembered ? localStorage : sessionStorage;
  const otherStorage = sessionPayload.remembered ? sessionStorage : localStorage;

  try {
    storage.setItem(DEV_LOCAL_SESSION_KEY, JSON.stringify(sessionPayload));
    otherStorage.removeItem(DEV_LOCAL_SESSION_KEY);
  } catch (error) {
    // Ignore storage failures and keep the current in-memory session.
  }
}

function readLocalDevelopmentSession() {
  try {
    const localValue = localStorage.getItem(DEV_LOCAL_SESSION_KEY);
    if (localValue) return JSON.parse(localValue);
  } catch (error) {
    // Ignore parse issues and fall back to session storage.
  }

  try {
    const sessionValue = sessionStorage.getItem(DEV_LOCAL_SESSION_KEY);
    if (sessionValue) return JSON.parse(sessionValue);
  } catch (error) {
    // Ignore parse issues for local development fallback.
  }

  return null;
}

function clearLocalDevelopmentSession() {
  try {
    localStorage.removeItem(DEV_LOCAL_SESSION_KEY);
    sessionStorage.removeItem(DEV_LOCAL_SESSION_KEY);
  } catch (error) {
    // Ignore cleanup failures for local development fallback.
  }
}

function applyServerSession(payload) {
  const profile = normalizeAuthProfile(payload && payload.profile);
  state.authProfile = profile;
  state.authRemembered = Boolean(payload && payload.remembered);
  setStorageKey(payload && payload.storageKey ? payload.storageKey : '');

  const nameInput = document.getElementById('authNameInput');
  const emailInput = document.getElementById('authEmailInput');
  const rememberInput = document.getElementById('authRememberInput');
  if (profile && nameInput) nameInput.value = profile.name;
  if (profile && emailInput) emailInput.value = profile.email;
  if (rememberInput) rememberInput.checked = Boolean(payload && payload.remembered);
  updateDeviceAccessUi();
}

function clearServerSessionState() {
  state.authProfile = null;
  state.authRemembered = false;
  setStorageKey('');
  updateDeviceAccessUi();
}

async function apiRequest(url, options) {
  const settings = options || {};
  const headers = {
    Accept: 'application/json',
    ...(settings.headers || {}),
  };

  const requestOptions = {
    method: settings.method || 'GET',
    credentials: 'same-origin',
    headers,
    cache: 'no-store',
  };

  if (typeof settings.body !== 'undefined') {
    requestOptions.body = JSON.stringify(settings.body);
    requestOptions.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, requestOptions);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload && payload.error ? payload.error : 'Request failed.';
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.payload = payload;
    throw requestError;
  }

  return payload;
}

async function restoreServerSession() {
  try {
    const session = await apiRequest(SESSION_ENDPOINT, { method: 'GET' });
    if (!isValidSessionPayload(session)) {
      throw new Error('Local session endpoint returned an invalid response.');
    }
    applyServerSession(session);
    if (isLocalDevelopmentHost()) {
      persistLocalDevelopmentSession(session);
    }
    return Boolean(state.authProfile && state.storageKey);
  } catch (error) {
    if (isLocalDevelopmentHost()) {
      const localSession = readLocalDevelopmentSession();
      if (localSession) {
        applyServerSession(localSession);
        return Boolean(state.authProfile && state.storageKey);
      }
    }

    clearServerSessionState();
    return false;
  }
}

async function clearServerSession() {
  try {
    await apiRequest(SESSION_ENDPOINT, { method: 'DELETE' });
  } catch (error) {
    // Ignore delete failures and still clear the local runtime state.
  }

  clearLocalDevelopmentSession();
  clearServerSessionState();
}

async function getStorageCryptoKey() {
  if (!state.storageKey || !window.crypto || !window.crypto.subtle) return null;
  if (state.storageCryptoKeyPromise) return state.storageCryptoKeyPromise;

  const encoder = new TextEncoder();
  state.storageCryptoKeyPromise = window.crypto.subtle
    .digest('SHA-256', encoder.encode(state.storageKey))
    .then((digest) => window.crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']))
    .catch((error) => {
      state.storageCryptoKeyPromise = null;
      throw error;
    });

  return state.storageCryptoKeyPromise;
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function readProtectedStorage(key) {
  if (!state.storageKey) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.iv || !parsed.data) return null;

    const cryptoKey = await getStorageCryptoKey();
    if (!cryptoKey) return null;

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) },
      cryptoKey,
      base64ToBytes(parsed.data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    try {
      localStorage.removeItem(key);
    } catch (storageError) {
      // Ignore cleanup failures for corrupted protected storage.
    }
    return null;
  }
}

async function writeProtectedStorage(key, value) {
  if (!state.storageKey) return false;

  try {
    const cryptoKey = await getStorageCryptoKey();
    if (!cryptoKey) return false;

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
    localStorage.setItem(key, JSON.stringify({
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(encrypted)),
    }));
    return true;
  } catch (error) {
    return false;
  }
}

function clearProtectedRuntimeState() {
  state.codeWord = '';
  state.contacts = [];
  state.events = [];
  state.conversation = 'routine';
  state.voiceTranscript = '';
  state.voiceInterim = '';
  state.alertActive = false;
  state.lastLocation = null;
  state.security = createDefaultSecurityState();
  state.wearable.connectedDevice = null;
  state.wearable.lastPairedDevice = null;
  state.wearable.batteryLevel = null;
  state.wearable.signalStrength = null;
  state.wearable.lastSyncAt = null;
}

async function restoreProtectedState() {
  clearProtectedRuntimeState();

  const [savedSettings, savedWearable] = await Promise.all([
    readProtectedStorage(STORAGE_KEY),
    readProtectedStorage(WEARABLE_DEVICE_KEY),
  ]);

  if (savedSettings) {
    state.codeWord = typeof savedSettings.codeWord === 'string' ? savedSettings.codeWord : '';
    state.contacts = Array.isArray(savedSettings.contacts)
      ? savedSettings.contacts.map(normalizeContact).filter(Boolean)
      : [];
    state.security = normalizeSecurityState(savedSettings.security);
  }

  if (state.contacts.length && !state.contacts.some((contact) => contact.primary)) {
    state.contacts[0].primary = true;
  }

  if (savedWearable) {
    state.wearable.lastPairedDevice = normalizeWearableProfile(savedWearable);
  }

  removeAutoAddedEmergencyContact();
}

function initWearableBridge() {
  state.wearable.bluetoothSupported = Boolean(navigator.bluetooth);
  state.wearable.secureContext = Boolean(window.isSecureContext);
  state.wearable.message = getWearableIdleMessage();
}

function normalizeWearableProfile(value) {
  if (!value || typeof value !== 'object') return null;

  const name = String(value.name || '').trim();
  if (!name) return null;

  const batteryLevel = Number(value.batteryLevel);
  const restingHeartRate = Number(value.restingHeartRate);

  return {
    id: String(value.id || name.toLowerCase().replace(/\s+/g, '-') || Date.now()),
    name,
    profile: String(value.profile || 'Heart-rate sensor').trim(),
    batteryLevel: Number.isFinite(batteryLevel) ? Math.max(0, Math.min(100, Math.round(batteryLevel))) : null,
    signalStrength: String(value.signalStrength || 'Good').trim(),
    restingHeartRate: Number.isFinite(restingHeartRate)
      ? Math.max(50, Math.min(150, Math.round(restingHeartRate)))
      : 80,
    source: String(value.source || 'demo').trim(),
  };
}

async function persistLastPairedWearable(device) {
  const profile = normalizeWearableProfile(device);
  if (!profile) return;

  state.wearable.lastPairedDevice = profile;
  await writeProtectedStorage(WEARABLE_DEVICE_KEY, {
    ...profile,
    savedAt: new Date().toISOString(),
  });
}

function getWearableIdleMessage() {
  const last = state.wearable.lastPairedDevice;
  if (last && last.name) {
    return `${last.name} was paired earlier. Reconnect it to resume live heart-rate monitoring.`;
  }

  return 'Scan for a nearby watch to start live heart-rate monitoring and Bluetooth safety syncing.';
}

function canUseBrowserBluetooth() {
  return state.wearable.bluetoothSupported && state.wearable.secureContext;
}

function isWearableConnected() {
  return state.wearable.status === 'connected';
}

function isWearableBusy() {
  return ['scanning', 'selecting', 'pairing', 'syncing'].includes(state.wearable.status);
}

function getHeartRateForPayload() {
  return isWearableConnected() ? state.heartRate : null;
}

function getWearableForPayload() {
  const connectedDevice = state.wearable.connectedDevice;
  return {
    status: state.wearable.status,
    source: state.wearable.source,
    deviceName: connectedDevice ? connectedDevice.name : '',
    batteryLevel: isWearableConnected() ? state.wearable.batteryLevel : null,
    signalStrength: isWearableConnected() ? state.wearable.signalStrength : null,
    lastSyncAt: state.wearable.lastSyncAt,
  };
}

function clearWearableScanTimer() {
  if (state.wearable.scanTimerId) {
    clearTimeout(state.wearable.scanTimerId);
    state.wearable.scanTimerId = null;
  }
}

function clearWearableStageTimers() {
  state.wearable.stageTimerIds.forEach((timerId) => clearTimeout(timerId));
  state.wearable.stageTimerIds = [];
}

function clearWearableTelemetryTimer() {
  if (state.wearable.telemetryTimerId) {
    clearInterval(state.wearable.telemetryTimerId);
    state.wearable.telemetryTimerId = null;
  }
}

function resetWearableLink(message) {
  clearWearableScanTimer();
  clearWearableStageTimers();
  clearWearableTelemetryTimer();

  const realDevice = state.wearable.realDevice;
  if (realDevice && realDevice.gatt && realDevice.gatt.connected) {
    try {
      state.wearable.suppressDisconnectEvent = true;
      realDevice.gatt.disconnect();
    } catch (error) {
      // Ignore disconnect failures and continue resetting the local demo state.
    }
  }

  state.wearable.availableDevices = [];
  state.wearable.connectedDevice = null;
  state.wearable.realDevice = null;
  state.wearable.status = 'disconnected';
  state.wearable.message = message || getWearableIdleMessage();
  state.wearable.source = 'standby';
  state.wearable.batteryLevel = null;
  state.wearable.signalStrength = null;
}

function createDemoWearableList() {
  return DEMO_WEARABLES.map((device) => normalizeWearableProfile({
    ...device,
    batteryLevel: Math.max(35, Math.min(98, device.batteryLevel + Math.floor(Math.random() * 7) - 3)),
    signalStrength: ['Strong', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
    source: 'demo',
  }));
}

function getNextSignalStrength(current) {
  const levels = ['Strong', 'Good', 'Fair'];
  const baseIndex = Math.max(0, levels.indexOf(current));
  const nextIndex = Math.max(0, Math.min(levels.length - 1, baseIndex + (Math.floor(Math.random() * 3) - 1)));
  return levels[nextIndex];
}

function startWearableTelemetry(device) {
  clearWearableTelemetryTimer();

  const baseRate = device && device.restingHeartRate ? device.restingHeartRate : 80;
  state.heartRate = baseRate;
  state.wearable.lastSyncAt = new Date().toISOString();

  state.wearable.telemetryTimerId = setInterval(() => {
    if (!isWearableConnected()) return;

    const floor = Math.max(58, baseRate - 10);
    const ceiling = Math.min(118, baseRate + 16);
    const drift = Math.floor(Math.random() * 7) - 3;
    const nextRate = state.heartRate + drift;

    state.heartRate = Math.max(floor, Math.min(ceiling, nextRate));

    if (typeof state.wearable.batteryLevel === 'number' && Math.random() < 0.22) {
      state.wearable.batteryLevel = Math.max(12, state.wearable.batteryLevel - 1);
    }

    state.wearable.signalStrength = getNextSignalStrength(state.wearable.signalStrength || 'Good');
    state.wearable.lastSyncAt = new Date().toISOString();

    updateWearableUi();
    updateHRDisplay();
    updateBanner();
  }, WEARABLE_TELEMETRY_INTERVAL_MS);
}

async function readRealWearableBatteryLevel(server) {
  if (!server) return null;

  try {
    const service = await server.getPrimaryService('battery_service');
    const characteristic = await service.getCharacteristic('battery_level');
    const value = await characteristic.readValue();
    return value.getUint8(0);
  } catch (error) {
    return null;
  }
}

async function connectToRealWearable(device) {
  if (!device || !device.gatt) {
    return { batteryLevel: null };
  }

  try {
    const server = await device.gatt.connect();
    const batteryLevel = await readRealWearableBatteryLevel(server);
    return { batteryLevel };
  } catch (error) {
    return { batteryLevel: null };
  }
}

function finalizeWearableConnection(device, options) {
  const profile = normalizeWearableProfile({
    ...device,
    source: options && options.source ? options.source : device.source,
    batteryLevel: options && typeof options.batteryLevel === 'number' ? options.batteryLevel : device.batteryLevel,
    signalStrength: options && options.signalStrength ? options.signalStrength : device.signalStrength,
  });

  if (!profile) return;

  state.wearable.connectedDevice = profile;
  state.wearable.availableDevices = [];
  state.wearable.status = 'connected';
  state.wearable.source = profile.source || 'demo';
  state.wearable.batteryLevel = typeof profile.batteryLevel === 'number' ? profile.batteryLevel : 76;
  state.wearable.signalStrength = profile.signalStrength || 'Good';
  state.wearable.lastSyncAt = new Date().toISOString();
  state.wearable.message = `${profile.name} connected. Live heart-rate streaming is active.`;

  persistLastPairedWearable(profile);
  startWearableTelemetry(profile);
  renderAll();

  showToast(`${profile.name} connected via Bluetooth.`, 'teal');
  logEvent({
    title: 'Wearable connected',
    detail: `${profile.name} paired over ${state.wearable.source === 'browser' ? 'browser Bluetooth' : 'demo Bluetooth'} and is streaming live heart-rate data.`,
    icon: 'fas fa-tower-broadcast',
    accent: '#198A73',
  });
}

async function connectWearableDevice(device, options) {
  const profile = normalizeWearableProfile({
    ...device,
    source: options && options.source ? options.source : device.source,
  });
  if (!profile) return;

  clearWearableScanTimer();
  clearWearableStageTimers();
  clearWearableTelemetryTimer();

  state.wearable.connectedDevice = profile;
  state.wearable.availableDevices = [];
  state.wearable.status = 'pairing';
  state.wearable.source = profile.source || 'demo';
  state.wearable.message = `Pairing with ${profile.name}...`;
  state.wearable.realDevice = options && options.realDevice ? options.realDevice : null;
  state.wearable.suppressDisconnectEvent = false;

  renderAll();

  const pairTimer = setTimeout(() => {
    state.wearable.status = 'syncing';
    state.wearable.message = `${profile.name} paired. Syncing heart-rate and safety channels...`;
    renderAll();
  }, 1300);

  const syncTimer = setTimeout(async () => {
    let batteryLevel = profile.batteryLevel;
    if (options && options.realDevice) {
      const realLink = await connectToRealWearable(options.realDevice);
      if (typeof realLink.batteryLevel === 'number') {
        batteryLevel = realLink.batteryLevel;
      }
    }

    if (!['pairing', 'syncing'].includes(state.wearable.status)) return;
    finalizeWearableConnection(profile, {
      source: profile.source,
      batteryLevel,
      signalStrength: profile.signalStrength || 'Good',
    });
  }, 2800);

  state.wearable.stageTimerIds.push(pairTimer, syncTimer);
}

function startDemoWearableScan() {
  clearWearableScanTimer();
  clearWearableStageTimers();

  state.wearable.availableDevices = [];
  state.wearable.connectedDevice = null;
  state.wearable.status = 'scanning';
  state.wearable.source = 'demo';
  state.wearable.message = 'Scanning for nearby Bluetooth watches...';

  renderAll();
  logEvent({
    title: 'Wearable scan started',
    detail: 'WearGuard started a nearby Bluetooth watch scan in demo mode.',
    icon: 'fas fa-tower-broadcast',
    accent: '#198A73',
  });

  state.wearable.scanTimerId = setTimeout(() => {
    state.wearable.availableDevices = createDemoWearableList();
    state.wearable.status = 'selecting';
    state.wearable.message = `${state.wearable.availableDevices.length} nearby watches found. Choose one to pair.`;
    state.wearable.scanTimerId = null;
    renderAll();
    showToast('Nearby watches found. Choose one to continue.', 'teal');
  }, 1700);
}

async function requestBrowserWearable() {
  state.wearable.availableDevices = [];
  state.wearable.connectedDevice = null;
  state.wearable.status = 'scanning';
  state.wearable.source = 'browser';
  state.wearable.message = 'Open the Bluetooth picker and choose your watch to continue.';

  renderAll();
  logEvent({
    title: 'Bluetooth picker opened',
    detail: 'WearGuard is waiting for a watch selection from the browser Bluetooth picker.',
    icon: 'fas fa-tower-broadcast',
    accent: '#198A73',
  });

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service', 'heart_rate', 'device_information'],
    });

    if (!device) {
      showToast('No watch was selected. Switching to demo watches.', 'amber');
      startDemoWearableScan();
      return;
    }

    try {
      device.addEventListener('gattserverdisconnected', handleRealWearableDisconnect);
    } catch (error) {
      // Event listener support may vary by browser and device.
    }

    const profile = normalizeWearableProfile({
      id: device.id || `watch-${Date.now()}`,
      name: device.name || 'Unnamed Bluetooth watch',
      profile: 'Browser-selected Bluetooth wearable',
      batteryLevel: null,
      signalStrength: 'Good',
      restingHeartRate: 80,
      source: 'browser',
    });

    await connectWearableDevice(profile, {
      source: 'browser',
      realDevice: device,
    });
  } catch (error) {
    const wasCancelled = error && (error.name === 'NotFoundError' || error.name === 'AbortError');
    if (wasCancelled) {
      showToast('No watch was selected. Switching to demo watches.', 'amber');
      startDemoWearableScan();
      return;
    }

    showToast('Browser Bluetooth was unavailable. Switching to demo watch scan.', 'amber');
    startDemoWearableScan();
  }
}

function startWearableConnection() {
  if (state.authLocked) {
    showToast('Sign in before pairing a watch.', 'amber');
    return;
  }

  if (isWearableConnected()) {
    showToast('A watch is already connected. Disconnect it before pairing another one.', 'teal');
    return;
  }

  if (isWearableBusy()) return;

  if (canUseBrowserBluetooth()) {
    requestBrowserWearable();
    return;
  }

  startDemoWearableScan();
}

function selectWearableDevice(deviceId) {
  if (state.wearable.status !== 'selecting') return;
  const device = state.wearable.availableDevices.find((entry) => entry.id === deviceId);
  if (!device) return;
  connectWearableDevice(device, { source: 'demo' });
}

function handleRealWearableDisconnect() {
  if (state.wearable.suppressDisconnectEvent) {
    state.wearable.suppressDisconnectEvent = false;
    return;
  }

  if (!isWearableConnected()) return;

  const deviceName = state.wearable.connectedDevice ? state.wearable.connectedDevice.name : 'Your watch';
  resetWearableLink(`${deviceName} lost its Bluetooth link. Reconnect to resume live heart-rate monitoring.`);
  renderAll();
  showToast(`${deviceName} disconnected unexpectedly.`, 'amber');
  logEvent({
    title: 'Wearable disconnected',
    detail: `${deviceName} dropped the Bluetooth connection, so live watch data has paused.`,
    icon: 'fas fa-circle-exclamation',
    accent: '#F0A03A',
  });
}

function disconnectWearable(userInitiated) {
  if (state.wearable.status === 'disconnected' && !state.wearable.availableDevices.length) return;

  const previousStatus = state.wearable.status;
  const deviceName = state.wearable.connectedDevice
    ? state.wearable.connectedDevice.name
    : state.wearable.lastPairedDevice
      ? state.wearable.lastPairedDevice.name
      : 'watch pairing';

  resetWearableLink(getWearableIdleMessage());
  renderAll();

  if (!userInitiated) return;

  if (previousStatus === 'connected') {
    showToast(`${deviceName} disconnected.`, 'amber');
    logEvent({
      title: 'Wearable disconnected',
      detail: `${deviceName} was disconnected and live heart-rate monitoring was paused.`,
      icon: 'fas fa-stop',
      accent: '#F0A03A',
    });
    return;
  }

  showToast('Bluetooth connection cancelled.', 'amber');
  logEvent({
    title: 'Wearable pairing cancelled',
    detail: `WearGuard stopped the active Bluetooth flow before ${deviceName} finished syncing.`,
    icon: 'fas fa-stop',
    accent: '#F0A03A',
  });
}

function updateWearableUi() {
  const headerStatus = document.getElementById('wearableHeaderStatus');
  const dot = document.getElementById('wearableDot');
  const headerLabel = document.getElementById('wearableLabel');
  const deviceName = document.getElementById('wearableDeviceName');
  const stateBadge = document.getElementById('wearableStateBadge');
  const statusText = document.getElementById('wearableStatusText');
  const modeText = document.getElementById('wearableModeText');
  const connectBtn = document.getElementById('wearableConnectBtn');
  const disconnectBtn = document.getElementById('wearableDisconnectBtn');
  const deviceList = document.getElementById('wearableDeviceList');
  const transportValue = document.getElementById('wearableTransportValue');
  const batteryValue = document.getElementById('wearableBatteryValue');
  const signalValue = document.getElementById('wearableSignalValue');
  const syncValue = document.getElementById('wearableSyncValue');
  const progressSteps = document.querySelectorAll('.wearable-step');

  if (!headerStatus || !dot || !headerLabel || !deviceName || !stateBadge || !statusText || !modeText || !connectBtn || !disconnectBtn || !deviceList || !transportValue || !batteryValue || !signalValue || !syncValue || !progressSteps.length) {
    return;
  }

  const status = state.wearable.status;
  const connectedDevice = state.wearable.connectedDevice;
  const lastDevice = state.wearable.lastPairedDevice;
  const tone = status === 'connected'
    ? 'connected'
    : ['scanning', 'selecting', 'pairing', 'syncing'].includes(status)
      ? 'busy'
      : status === 'error'
        ? 'error'
        : 'offline';

  headerStatus.className = `header-status ${tone}`;
  dot.className = `status-dot ${tone}`;

  if (status === 'connected') {
    headerLabel.textContent = `${connectedDevice.name} connected`;
  } else if (['scanning', 'selecting'].includes(status)) {
    headerLabel.textContent = 'Scanning for watch';
  } else if (['pairing', 'syncing'].includes(status)) {
    headerLabel.textContent = 'Pairing watch';
  } else {
    headerLabel.textContent = 'Watch offline';
  }

  if (status === 'connected' && connectedDevice) {
    deviceName.textContent = connectedDevice.name;
  } else if (['pairing', 'syncing'].includes(status) && connectedDevice) {
    deviceName.textContent = connectedDevice.name;
  } else if (status === 'selecting') {
    deviceName.textContent = 'Nearby watches found';
  } else if (status === 'scanning') {
    deviceName.textContent = 'Searching nearby';
  } else if (lastDevice) {
    deviceName.textContent = `${lastDevice.name} (offline)`;
  } else {
    deviceName.textContent = 'No watch paired';
  }

  stateBadge.className = `wearable-badge ${tone}`;
  stateBadge.textContent = status === 'connected'
    ? 'Connected'
    : status === 'scanning'
      ? 'Scanning'
      : status === 'selecting'
        ? 'Select a watch'
        : status === 'pairing'
          ? 'Pairing'
          : status === 'syncing'
            ? 'Syncing'
            : status === 'error'
              ? 'Issue'
              : 'Offline';

  statusText.textContent = state.wearable.message || getWearableIdleMessage();

  if (status === 'connected') {
    modeText.textContent = state.wearable.source === 'browser'
      ? 'Browser Bluetooth is linked. WearGuard is demonstrating a live sensor stream on top of that connection.'
      : 'Demo Bluetooth mode is active so you can walk through scan, pair, and live sync without real watch hardware.';
  } else if (status === 'scanning' && state.wearable.source === 'browser') {
    modeText.textContent = 'Choose your watch in the browser Bluetooth picker when it appears.';
  } else if (status === 'selecting') {
    modeText.textContent = 'Pick one of the nearby watches below to continue the Bluetooth pairing demo.';
  } else {
    modeText.textContent = canUseBrowserBluetooth()
      ? 'Browser Bluetooth is available here. WearGuard opens the browser picker first, then completes pairing and sync in-app.'
      : 'Browser Bluetooth is unavailable in this tab, so WearGuard uses a demo watch list to show the full connection flow.';
  }

  connectBtn.disabled = isWearableBusy() || status === 'connected';
  connectBtn.innerHTML = `<i class="fas fa-tower-broadcast"></i> ${
    status === 'connected'
      ? 'Watch connected'
      : status === 'scanning'
        ? 'Scanning...'
        : status === 'selecting'
          ? 'Choose a watch below'
          : status === 'pairing'
            ? 'Pairing...'
            : status === 'syncing'
              ? 'Syncing...'
              : 'Connect via Bluetooth'
  }`;

  disconnectBtn.disabled = status === 'disconnected' && !state.wearable.availableDevices.length;
  disconnectBtn.innerHTML = `<i class="fas fa-stop"></i> ${
    status === 'connected'
      ? 'Disconnect'
      : isWearableBusy()
        ? 'Cancel'
        : 'Disconnect'
  }`;

  transportValue.textContent = status === 'connected'
    ? (state.wearable.source === 'browser' ? 'Browser Bluetooth' : 'Demo Bluetooth')
    : canUseBrowserBluetooth()
      ? 'Bluetooth ready'
      : 'Demo fallback';
  batteryValue.textContent = status === 'connected' && typeof state.wearable.batteryLevel === 'number'
    ? `${state.wearable.batteryLevel}%`
    : '--';
  signalValue.textContent = status === 'connected'
    ? (state.wearable.signalStrength || 'Good')
    : status === 'scanning'
      ? 'Searching'
      : status === 'selecting'
        ? `${state.wearable.availableDevices.length} found`
        : 'Idle';
  syncValue.textContent = status === 'connected' && state.wearable.lastSyncAt
    ? formatTime(new Date(state.wearable.lastSyncAt))
    : state.wearable.lastSyncAt
      ? `Last ${formatTime(new Date(state.wearable.lastSyncAt))}`
      : 'Not yet';

  progressSteps.forEach((step) => {
    const stepName = step.getAttribute('data-step');
    step.classList.remove('active', 'done');

    if (stepName === 'scan') {
      if (['scanning', 'selecting'].includes(status)) step.classList.add('active');
      if (['pairing', 'syncing', 'connected'].includes(status)) step.classList.add('done');
    }

    if (stepName === 'pair') {
      if (status === 'pairing') step.classList.add('active');
      if (['syncing', 'connected'].includes(status)) step.classList.add('done');
    }

    if (stepName === 'sync') {
      if (status === 'syncing') step.classList.add('active');
      if (status === 'connected') step.classList.add('done');
    }
  });

  deviceList.innerHTML = '';
  if (status === 'scanning') {
    deviceList.innerHTML = '<div class="wearable-empty">Scanning the nearby Bluetooth space for compatible watches...</div>';
    return;
  }

  if (!state.wearable.availableDevices.length) {
    deviceList.innerHTML = `<div class="wearable-empty">${
      status === 'connected'
        ? 'Live heart-rate data is flowing from the active watch.'
        : 'No nearby watch list yet. Start a Bluetooth scan to begin the demonstration.'
    }</div>`;
    return;
  }

  state.wearable.availableDevices.forEach((device) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wearable-device';
    button.disabled = status !== 'selecting';
    button.addEventListener('click', () => selectWearableDevice(device.id));

    const topRow = document.createElement('div');
    topRow.className = 'wearable-device-row';

    const nameEl = document.createElement('strong');
    nameEl.textContent = device.name;

    const signalEl = document.createElement('span');
    signalEl.textContent = device.signalStrength;

    topRow.appendChild(nameEl);
    topRow.appendChild(signalEl);

    const copyEl = document.createElement('div');
    copyEl.className = 'wearable-device-copy';
    copyEl.textContent = device.profile;

    const metaEl = document.createElement('div');
    metaEl.className = 'wearable-device-meta';
    metaEl.textContent = `${device.batteryLevel || '--'}% battery`;

    button.appendChild(topRow);
    button.appendChild(copyEl);
    button.appendChild(metaEl);
    deviceList.appendChild(button);
  });
}

async function persistSettings() {
  await writeProtectedStorage(STORAGE_KEY, {
    codeWord: state.codeWord,
    contacts: state.contacts,
    security: state.security,
  });
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

function getSecurityReviewMap(group) {
  if (group === 'threat') return state.security.threatReviews;
  if (group === 'coding') return state.security.secureCodingReviews;
  if (group === 'integration') return state.security.integrationReviews;
  return null;
}

function syncInputValue(id, value) {
  const element = document.getElementById(id);
  if (!element) return;

  const normalizedValue = value == null ? '' : String(value);
  if (document.activeElement === element) return;
  if (element.value !== normalizedValue) {
    element.value = normalizedValue;
  }
}

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (!element) return;

  const normalizedValue = value == null ? '' : String(value);
  if (element.textContent !== normalizedValue) {
    element.textContent = normalizedValue;
  }
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function countCheckedValues(map) {
  return Object.values(map || {}).filter(Boolean).length;
}

function getSecurityScaleMeta(value) {
  return SECURITY_SCALE[value] || SECURITY_SCALE.moderate;
}

function formatSecurityDate(value) {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSecurityDateTime(value) {
  if (!value) return 'Not run';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not run';
  return date.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isLocalDevelopmentSessionActive() {
  return Boolean(state.storageKey && state.storageKey.startsWith('wearguard-local-dev:'));
}

function getPrimaryContact() {
  return state.contacts.find((contact) => contact.primary) || state.contacts[0] || null;
}

function computeSecurityRiskProfile() {
  const weightedSum =
    getSecurityScaleMeta(state.security.exposure).weight +
    getSecurityScaleMeta(state.security.dataSensitivity).weight +
    getSecurityScaleMeta(state.security.integrationCriticality).weight +
    getSecurityScaleMeta(state.security.attackSurface).weight +
    (state.security.scope === 'production' ? 1 : state.security.scope === 'prototype' ? -1 : 0);

  const score = clampNumber(Math.round(((weightedSum - 3) / 14) * 100), 0, 100);
  let level = 'Low';

  if (score >= 80) {
    level = 'Critical';
  } else if (score >= 60) {
    level = 'High';
  } else if (score >= 35) {
    level = 'Moderate';
  }

  const scopeLabel = state.security.scope === 'production'
    ? 'production'
    : state.security.scope === 'prototype'
      ? 'prototype'
      : 'pilot';

  return {
    score,
    level,
    text: `${scopeLabel[0].toUpperCase()}${scopeLabel.slice(1)} scope with ${level.toLowerCase()} inherent risk pressure.`,
  };
}

function getSecurityAutoControls() {
  const hasSecureSession = Boolean(state.authProfile && state.storageKey);
  const hasCrypto = Boolean(window.crypto && window.crypto.subtle);
  const localDevSession = isLocalDevelopmentSessionActive();
  const secureContext = Boolean(window.isSecureContext);

  return [
    {
      id: 'sessionBoundary',
      title: 'Session boundary',
      status: hasSecureSession ? (localDevSession ? 'warn' : 'pass') : 'warn',
      detail: hasSecureSession
        ? localDevSession
          ? 'A local-development session is active. Use real server-backed authentication for production demonstrations.'
          : 'A session-backed access path is active for this browser.'
        : 'Sign in before validating session-backed storage and access controls.',
    },
    {
      id: 'protectedStorage',
      title: 'Protected storage',
      status: hasCrypto ? (hasSecureSession ? 'pass' : 'warn') : 'fail',
      detail: hasCrypto
        ? hasSecureSession
          ? 'Sensitive settings can be encrypted against the active session storage key.'
          : 'Web Crypto is available, but protected browser storage is only useful after a session is established.'
        : 'Web Crypto is unavailable, so encrypted browser storage cannot be enforced here.',
    },
    {
      id: 'secureOrigin',
      title: 'Secure origin for sensors',
      status: secureContext ? 'pass' : isLocalDevelopmentHost() ? 'warn' : 'fail',
      detail: secureContext
        ? 'Sensitive browser APIs can use a secure origin and permission model.'
        : isLocalDevelopmentHost()
          ? 'Local development is allowed, but production deployment should use HTTPS for Bluetooth and secure cookies.'
          : 'A non-secure origin weakens cookies, Bluetooth, and permission-sensitive features.',
    },
    {
      id: 'safeRendering',
      title: 'Safe DOM rendering path',
      status: 'pass',
      detail: 'Contacts, activity events, and assessment findings render through DOM APIs instead of raw HTML injection.',
    },
    {
      id: 'permissionBoundary',
      title: 'Permission boundary',
      status: (navigator.geolocation || navigator.bluetooth || state.voiceSupported) ? 'pass' : 'warn',
      detail: 'Bluetooth, microphone, and location flows still require explicit browser permission prompts.',
    },
  ];
}

function getSecurityIntegrationStatuses() {
  const hasSecureSession = Boolean(state.authProfile && state.storageKey);
  const primaryContact = getPrimaryContact();
  const hasCrypto = Boolean(window.crypto && window.crypto.subtle);
  const secureContext = Boolean(window.isSecureContext);
  const localDev = isLocalDevelopmentHost() || isLocalDevelopmentSessionActive();

  return [
    {
      title: 'Session flow',
      status: hasSecureSession ? (isLocalDevelopmentSessionActive() ? 'warn' : 'pass') : 'warn',
      detail: hasSecureSession
        ? isLocalDevelopmentSessionActive()
          ? 'Local-development auth fallback is active and should be removed or disabled before production.'
          : 'Session state is available for protected features and review storage.'
        : 'No authenticated session is active right now.',
    },
    {
      title: 'Wearable pairing',
      status: canUseBrowserBluetooth() ? 'pass' : 'warn',
      detail: canUseBrowserBluetooth()
        ? 'Bluetooth pairing can use a secure browser context when a real wearable is available.'
        : 'This runtime may fall back to demo wearables or lacks the secure context required for real Bluetooth pairing.',
    },
    {
      title: 'Alert delivery',
      status: primaryContact ? 'warn' : 'fail',
      detail: primaryContact
        ? 'Emergency routing has a primary recipient, but production still needs authenticated relay and delivery ownership.'
        : 'No primary contact is configured, so emergency delivery is not operational yet.',
    },
    {
      title: 'Protected data',
      status: hasCrypto ? (hasSecureSession ? 'pass' : 'warn') : 'fail',
      detail: hasCrypto
        ? hasSecureSession
          ? 'Browser storage can be tied to the current session key.'
          : 'Storage protection is available but idle until a session is present.'
        : 'Protected storage support is missing in this environment.',
    },
    {
      title: 'Deployment mode',
      status: localDev ? 'warn' : 'pass',
      detail: localDev
        ? 'Local-development allowances are visible. Re-test under the final HTTPS deployment before sign-off.'
        : 'The runtime is closer to a real deployment posture than a localhost demo.',
    },
    {
      title: 'Permission journeys',
      status: secureContext ? 'pass' : 'warn',
      detail: 'Bluetooth, microphone, and location prompts should be verified on the target browsers and devices.',
    },
  ];
}

function getSecurityRequirementCards() {
  const autoControls = getSecurityAutoControls();
  const autoPassCount = autoControls.filter((control) => control.status === 'pass').length;
  const threatReviewed = countCheckedValues(state.security.threatReviews);
  const secureCodingReviewed = countCheckedValues(state.security.secureCodingReviews);
  const integrationReviewed = countCheckedValues(state.security.integrationReviews);
  const testingComplete = state.security.testing.lastRunAt ? 1 : 0;
  const testingHealthy = state.security.testing.lastRunAt && state.security.testing.failCount === 0 ? 1 : 0;

  return [
    {
      title: 'Risk Assessment',
      completed: [
        state.security.owner,
        state.security.reviewDate,
        state.security.scope,
        state.security.exposure,
        state.security.dataSensitivity,
        state.security.integrationCriticality,
        state.security.attackSurface,
      ].filter(Boolean).length,
      total: 7,
    },
    {
      title: 'Threat Modelling',
      completed: threatReviewed + (state.security.designReviewNotes ? 1 : 0),
      total: SECURITY_THREAT_CATALOG.length + 1,
    },
    {
      title: 'Secure Development',
      completed: secureCodingReviewed + autoPassCount,
      total: SECURITY_CODING_REVIEW_ITEMS.length + autoControls.length,
    },
    {
      title: 'Security Testing',
      completed: testingComplete + testingHealthy,
      total: 2,
    },
    {
      title: 'Secure Integration',
      completed: integrationReviewed + (state.security.integrationNotes ? 1 : 0),
      total: SECURITY_INTEGRATION_REVIEW_ITEMS.length + 1,
    },
  ].map((card) => {
    const ratio = card.total ? card.completed / card.total : 0;
    const tone = ratio >= 1 ? 'pass' : ratio >= 0.55 ? 'warn' : 'fail';
    return {
      ...card,
      ratio,
      tone,
      meta: `${card.completed}/${card.total} complete`,
    };
  });
}

function getSecurityReadinessSnapshot() {
  const risk = computeSecurityRiskProfile();
  const cards = getSecurityRequirementCards();
  const autoControls = getSecurityAutoControls();
  const integrationStatuses = getSecurityIntegrationStatuses();
  const totalCompleted = cards.reduce((sum, card) => sum + card.completed, 0);
  const totalPossible = cards.reduce((sum, card) => sum + card.total, 0);
  const coverageRatio = totalPossible ? totalCompleted / totalPossible : 0;
  const coveragePercent = Math.round(coverageRatio * 100);
  const autoPassRatio = autoControls.length
    ? autoControls.filter((control) => control.status === 'pass').length / autoControls.length
    : 0;

  const findingTotal = state.security.testing.passCount + state.security.testing.warnCount + state.security.testing.failCount;
  const testingRatio = state.security.testing.lastRunAt
    ? clampNumber(
        (
          state.security.testing.passCount +
          (state.security.testing.warnCount * 0.55) -
          (state.security.testing.failCount * 0.4)
        ) / Math.max(1, findingTotal),
        0,
        1
      )
    : 0.25;

  const readiness = clampNumber(
    Math.round((coverageRatio * 58) + (autoPassRatio * 24) + (testingRatio * 18) - ((risk.score / 100) * 16)),
    0,
    100
  );

  let tone = 'risk';
  let label = 'Baseline';
  let text = 'The platform still needs structured review and test evidence before it can claim a mature security posture.';

  if (readiness >= 80) {
    tone = 'strong';
    label = 'Strong';
    text = 'Security requirements are well-covered. The remaining work is mostly targeted follow-up before rollout.';
  } else if (readiness >= 60) {
    tone = 'progressing';
    label = 'Progressing';
    text = 'The platform has meaningful security controls, but a few review and deployment gaps still need attention.';
  } else if (readiness >= 40) {
    tone = 'attention';
    label = 'Needs work';
    text = 'The platform has partial controls in place, but more evidence is needed before it should be treated as deployment-ready.';
  }

  return {
    risk,
    cards,
    autoControls,
    integrationStatuses,
    coveragePercent,
    readiness,
    tone,
    label,
    text,
  };
}

function buildSecurityAssessmentSummary(snapshot) {
  const openThreats = SECURITY_THREAT_CATALOG
    .filter((item) => !state.security.threatReviews[item.id])
    .map((item) => item.title.toLowerCase());

  const lines = [
    `${snapshot.label} readiness (${snapshot.readiness}/100) for a ${state.security.scope} release. Inherent risk is ${snapshot.risk.level.toLowerCase()} based on exposure, data sensitivity, integration criticality, and attack surface.`,
    `${snapshot.coveragePercent}% of the embedded security requirements are documented. ${countCheckedValues(state.security.threatReviews)} of ${SECURITY_THREAT_CATALOG.length} threat scenarios are reviewed, and ${countCheckedValues(state.security.integrationReviews)} of ${SECURITY_INTEGRATION_REVIEW_ITEMS.length} integration controls are signed off.`,
  ];

  if (state.security.testing.lastRunAt) {
    lines.push(`Latest quick review: ${state.security.testing.passCount} pass, ${state.security.testing.warnCount} warn, ${state.security.testing.failCount} fail on ${formatSecurityDateTime(state.security.testing.lastRunAt)}.`);
  } else {
    lines.push('No quick security review has been run yet in this session.');
  }

  if (isLocalDevelopmentHost() || isLocalDevelopmentSessionActive()) {
    lines.push('Local-development allowances are still visible. Re-test under the final HTTPS deployment before presenting this posture as production-ready.');
  }

  if (openThreats.length) {
    lines.push(`Priority focus: ${openThreats.slice(0, 2).join('; ')}.`);
  }

  return lines.join('\n\n');
}

function renderSecurityModule() {
  renderSecurityOverview();
  renderSecurityChecklists();
  renderSecurityTesting();
  renderSecurityAssessmentSummary();
}

function renderSecurityOverview() {
  syncInputValue('securityOwnerInput', state.security.owner);
  syncInputValue('securityReviewDateInput', state.security.reviewDate);
  syncInputValue('securityScopeSelect', state.security.scope);
  syncInputValue('securityExposureSelect', state.security.exposure);
  syncInputValue('securityDataSelect', state.security.dataSensitivity);
  syncInputValue('securityIntegrationSelect', state.security.integrationCriticality);
  syncInputValue('securitySurfaceSelect', state.security.attackSurface);
  syncInputValue('securityDesignNotesInput', state.security.designReviewNotes);
  syncInputValue('securityIntegrationNotesInput', state.security.integrationNotes);

  const snapshot = getSecurityReadinessSnapshot();
  const badge = document.getElementById('securityReadinessBadge');

  setTextContent('securityReadinessScore', String(snapshot.readiness));
  setTextContent('securityReadinessBadge', snapshot.label);
  setTextContent('securityReadinessText', snapshot.text);
  setTextContent('securityRiskLevel', `${snapshot.risk.level} risk`);
  setTextContent('securityCoverageValue', `${snapshot.coveragePercent}%`);
  setTextContent('securityLastTestValue', state.security.testing.lastRunAt ? formatSecurityDateTime(state.security.testing.lastRunAt) : 'Not run');

  if (badge) {
    badge.className = `security-score-badge ${snapshot.tone}`;
  }

  renderSecurityRequirementCards(snapshot.cards);
}

function renderSecurityRequirementCards(cards) {
  const grid = document.getElementById('securityRequirementGrid');
  if (!grid) return;

  grid.replaceChildren();
  cards.forEach((card) => {
    const item = document.createElement('div');
    item.className = `security-requirement-card ${card.tone}`;

    const title = document.createElement('div');
    title.className = 'security-requirement-title';
    title.textContent = card.title;

    const meta = document.createElement('div');
    meta.className = 'security-requirement-meta';
    meta.textContent = card.meta;

    item.appendChild(title);
    item.appendChild(meta);
    grid.appendChild(item);
  });
}

function renderSecurityChecklists() {
  renderSecurityChecklist('securityThreatChecklist', SECURITY_THREAT_CATALOG, state.security.threatReviews, 'threat');
  renderSecurityChecklist('securityCodingChecklist', SECURITY_CODING_REVIEW_ITEMS, state.security.secureCodingReviews, 'coding');
  renderSecurityChecklist('securityIntegrationChecklist', SECURITY_INTEGRATION_REVIEW_ITEMS, state.security.integrationReviews, 'integration');
  renderSecurityAutoControls();
  renderSecurityIntegrationGrid();
}

function renderSecurityChecklist(containerId, items, values, group) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.replaceChildren();
  items.forEach((item) => {
    const label = document.createElement('label');
    label.className = 'security-check';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(values[item.id]);
    input.setAttribute('data-security-toggle', group);
    input.setAttribute('data-security-id', item.id);

    const body = document.createElement('div');
    body.className = 'security-check-body';

    const title = document.createElement('div');
    title.className = 'security-check-title';
    title.textContent = item.title;

    const detail = document.createElement('div');
    detail.className = 'security-check-copy';
    detail.textContent = item.detail;

    body.appendChild(title);
    body.appendChild(detail);

    if (item.mitigation) {
      const mitigation = document.createElement('div');
      mitigation.className = 'security-check-copy subtle';
      mitigation.textContent = `Mitigation focus: ${item.mitigation}`;
      body.appendChild(mitigation);
    }

    label.appendChild(input);
    label.appendChild(body);
    container.appendChild(label);
  });
}

function renderSecurityAutoControls() {
  const container = document.getElementById('securityAutoControlList');
  if (!container) return;

  container.replaceChildren();
  getSecurityAutoControls().forEach((control) => {
    const card = document.createElement('div');
    card.className = `security-control ${control.status}`;

    const head = document.createElement('div');
    head.className = 'security-control-head';

    const title = document.createElement('div');
    title.className = 'security-control-title';
    title.textContent = control.title;

    const pill = document.createElement('span');
    pill.className = `security-status-pill ${control.status}`;
    pill.textContent = control.status === 'pass' ? 'Pass' : control.status === 'warn' ? 'Watch' : 'Fail';

    const copy = document.createElement('div');
    copy.className = 'security-control-copy';
    copy.textContent = control.detail;

    head.appendChild(title);
    head.appendChild(pill);
    card.appendChild(head);
    card.appendChild(copy);
    container.appendChild(card);
  });
}

function renderSecurityIntegrationGrid() {
  const container = document.getElementById('securityIntegrationGrid');
  if (!container) return;

  container.replaceChildren();
  getSecurityIntegrationStatuses().forEach((status) => {
    const card = document.createElement('div');
    card.className = `security-control-card ${status.status}`;

    const title = document.createElement('div');
    title.className = 'security-control-title';
    title.textContent = status.title;

    const copy = document.createElement('div');
    copy.className = 'security-control-copy';
    copy.textContent = status.detail;

    card.appendChild(title);
    card.appendChild(copy);
    container.appendChild(card);
  });
}

function renderSecurityTesting() {
  const findingsWrap = document.getElementById('securityFindingList');
  const meta = document.getElementById('securityTestMeta');
  if (!findingsWrap || !meta) return;

  if (state.security.testing.lastRunAt) {
    meta.textContent = `Last quick review: ${formatSecurityDateTime(state.security.testing.lastRunAt)} - ${state.security.testing.passCount} pass, ${state.security.testing.warnCount} warn, ${state.security.testing.failCount} fail.`;
  } else {
    meta.textContent = 'No security review has been run yet in this session.';
  }

  findingsWrap.replaceChildren();
  if (!state.security.testing.findings.length) {
    const empty = document.createElement('div');
    empty.className = 'security-control';
    empty.textContent = 'Run the quick security review to generate findings from the current runtime and configuration.';
    findingsWrap.appendChild(empty);
    return;
  }

  state.security.testing.findings.forEach((finding) => {
    const card = document.createElement('div');
    card.className = `security-finding ${finding.status}`;

    const title = document.createElement('div');
    title.className = 'security-finding-title';
    title.textContent = finding.title;

    const detail = document.createElement('div');
    detail.className = 'security-finding-detail';
    detail.textContent = finding.detail;

    card.appendChild(title);
    card.appendChild(detail);
    findingsWrap.appendChild(card);
  });
}

function renderSecurityAssessmentSummary() {
  setTextContent('securityAssessmentSummary', buildSecurityAssessmentSummary(getSecurityReadinessSnapshot()));
}

function runSecurityReview() {
  const findings = [];
  const primaryContact = getPrimaryContact();
  const threatReviewed = countCheckedValues(state.security.threatReviews);
  const codingReviewed = countCheckedValues(state.security.secureCodingReviews);
  const integrationReviewed = countCheckedValues(state.security.integrationReviews);
  const hasSecureSession = Boolean(state.authProfile && state.storageKey);

  if (hasSecureSession && !isLocalDevelopmentSessionActive()) {
    findings.push({
      status: 'pass',
      title: 'Session control is active',
      detail: 'A session-backed access path is active and the current browser can use protected storage.',
    });
  } else if (hasSecureSession) {
    findings.push({
      status: 'warn',
      title: 'Local-development session bypass is active',
      detail: 'The current login flow still allows a localhost fallback. Remove or disable it before production use.',
    });
  } else {
    findings.push({
      status: 'fail',
      title: 'No authenticated session is active',
      detail: 'Run this review after sign-in so session-backed controls and protected storage can be assessed properly.',
    });
  }

  if (window.crypto && window.crypto.subtle) {
    findings.push({
      status: hasSecureSession ? 'pass' : 'warn',
      title: 'Protected browser storage is available',
      detail: hasSecureSession
        ? 'Web Crypto is available and sensitive settings can be tied to the current session key.'
        : 'Web Crypto is present, but an authenticated session is still needed before protection is meaningful.',
    });
  } else {
    findings.push({
      status: 'fail',
      title: 'Protected storage support is missing',
      detail: 'This browser runtime does not expose Web Crypto, so encrypted local storage cannot be enforced.',
    });
  }

  if (window.isSecureContext) {
    findings.push({
      status: 'pass',
      title: 'Sensitive APIs are running in a secure context',
      detail: 'Bluetooth, cookies, and permission-sensitive browser features can use a secure origin.',
    });
  } else {
    findings.push({
      status: isLocalDevelopmentHost() ? 'warn' : 'fail',
      title: 'Runtime is not using a secure origin',
      detail: isLocalDevelopmentHost()
        ? 'Local development is acceptable for demos, but the production platform should be tested under HTTPS.'
        : 'A non-secure deployment weakens cookies, Bluetooth, and permission-sensitive features.',
    });
  }

  if (threatReviewed === SECURITY_THREAT_CATALOG.length && state.security.designReviewNotes) {
    findings.push({
      status: 'pass',
      title: 'Threat model review is documented',
      detail: 'All embedded threat scenarios are acknowledged and design review notes are present.',
    });
  } else {
    findings.push({
      status: 'warn',
      title: 'Threat modelling still has open items',
      detail: `${threatReviewed}/${SECURITY_THREAT_CATALOG.length} threat scenarios are marked reviewed. Complete the remaining scenarios and capture design notes.`,
    });
  }

  if (codingReviewed === SECURITY_CODING_REVIEW_ITEMS.length) {
    findings.push({
      status: 'pass',
      title: 'Secure coding checklist is fully reviewed',
      detail: 'The embedded secure-development checklist is complete for the current release candidate.',
    });
  } else {
    findings.push({
      status: 'warn',
      title: 'Secure coding review needs more evidence',
      detail: `${codingReviewed}/${SECURITY_CODING_REVIEW_ITEMS.length} secure-coding checkpoints are marked complete.`,
    });
  }

  if (integrationReviewed === SECURITY_INTEGRATION_REVIEW_ITEMS.length && primaryContact) {
    findings.push({
      status: 'pass',
      title: 'Integration readiness looks healthy',
      detail: 'Integration review items are signed off and emergency routing has at least one primary recipient.',
    });
  } else if (primaryContact) {
    findings.push({
      status: 'warn',
      title: 'Integration sign-off is incomplete',
      detail: `${integrationReviewed}/${SECURITY_INTEGRATION_REVIEW_ITEMS.length} integration checkpoints are complete. Confirm relay, permissions, and retention decisions.`,
    });
  } else {
    findings.push({
      status: 'fail',
      title: 'Emergency delivery is not operational yet',
      detail: 'No primary contact is configured, so the integration path for real alerts is incomplete.',
    });
  }

  if (state.codeWord) {
    findings.push({
      status: 'pass',
      title: 'Private code word is configured',
      detail: 'Safety AI has a private trigger phrase to distinguish routine conversation from a covert help request.',
    });
  } else {
    findings.push({
      status: 'warn',
      title: 'No private code word is set',
      detail: 'Configure a private code word so the platform can demonstrate a stronger covert-alert control.',
    });
  }

  if (canUseBrowserBluetooth()) {
    findings.push({
      status: 'pass',
      title: 'Wearable transport can use secure Bluetooth',
      detail: 'This runtime is capable of real Bluetooth pairing inside a secure browser context.',
    });
  } else {
    findings.push({
      status: 'warn',
      title: 'Wearable transport is running in demo or limited mode',
      detail: 'Bluetooth either lacks a secure origin or is unavailable, so wearable trust should be re-tested on the target device.',
    });
  }

  state.security.testing = {
    lastRunAt: new Date().toISOString(),
    findings,
    passCount: findings.filter((finding) => finding.status === 'pass').length,
    warnCount: findings.filter((finding) => finding.status === 'warn').length,
    failCount: findings.filter((finding) => finding.status === 'fail').length,
  };

  persistSettings();
  renderSecurityModule();

  showToast(
    state.security.testing.failCount
      ? 'Quick security review finished with blocking findings.'
      : 'Quick security review completed.',
    state.security.testing.failCount ? 'amber' : 'teal'
  );

  logEvent({
    title: 'Security review executed',
    detail: `${state.security.testing.passCount} pass, ${state.security.testing.warnCount} warn, ${state.security.testing.failCount} fail recorded in the embedded security review.`,
    icon: 'fas fa-check-circle',
    accent: state.security.testing.failCount ? '#F0A03A' : '#198A73',
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

function formatHeartRateText(value) {
  return Number.isFinite(value) ? `${value} BPM` : 'Watch not connected';
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
    heartRate: getHeartRateForPayload(),
    transcript: state.voiceTranscript || '',
    codeWord: state.codeWord || '',
    timestamp: new Date().toISOString(),
    location,
    wearable: getWearableForPayload(),
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
    `Heart rate: ${formatHeartRateText(payload.heartRate)}`,
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
    heartRate: getHeartRateForPayload(),
    timestamp: new Date().toISOString(),
    location,
    wearable: getWearableForPayload(),
  };
}

function buildLocationMessage(contact, payload) {
  const label = contact ? contact.name : 'your trusted contact';
  const lines = [
    'WEARGUARD LIVE LOCATION',
    `For: ${label}`,
    payload.reason || 'Current location update',
    `Time: ${formatDateTime(payload.timestamp)}`,
    `Heart rate: ${formatHeartRateText(payload.heartRate)}`,
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

async function dispatchSecurePayload(kind, payload) {
  try {
    const result = await apiRequest(DISPATCH_ENDPOINT, {
      method: 'POST',
      body: { kind, payload },
    });

    return {
      delivered: Boolean(result && result.delivered),
      mode: result && result.mode ? result.mode : 'server-relay',
      message: result && result.message ? result.message : '',
    };
  } catch (error) {
    return {
      delivered: false,
      mode: 'client-fallback',
      message: error.message || 'Secure relay unavailable.',
      unauthorized: error.status === 401,
    };
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

  const cfg = options || {};
  const primary = state.contacts.find(c => c.primary) || state.contacts[0];
  if (!primary) {
    showToast('Add a primary contact first.', 'amber');
    logEvent({
      title: 'Emergency alert blocked',
      detail: 'No primary contact is configured yet.',
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
  const deliveredChannels = primary
    ? deliverToContact(primary, 'WearGuard Emergency Alert', message, {
        allowSms: true,
        allowCall: Boolean(cfg.allowCall),
        openAll: Boolean(cfg.openAllChannels),
      })
    : [];
  const sentAny = deliveredChannels.length > 0;

  if (!sentAny) {
    state.alertActive = false;
    setPanicUiState(false);
    updateBanner();
    showToast('No real delivery route is configured yet.', 'amber');
    logEvent({
      title: 'Emergency alert failed',
      detail: 'Add WhatsApp, email, or phone details to send alerts.',
      icon: 'fas fa-triangle-exclamation',
      accent: '#F0A03A',
    });
    return;
  }

  const recipient = primary.name;
  logEvent({
    title: 'Emergency alert sent',
    detail: `${reason} Sent to ${recipient} with location and heart-rate snapshot.`,
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

  const cfg = options || {};
  const primary = state.contacts.find(c => c.primary) || state.contacts[0] || null;
  if (!primary) {
    showToast('Add a primary contact first.', 'amber');
    logEvent({
      title: 'Emergency alert blocked',
      detail: 'No primary contact is configured yet.',
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
  const relayResult = await dispatchSecurePayload('emergency', payload);
  const message = buildEmergencyMessage(payload);
  const deliveredChannels = !relayResult.delivered && primary
    ? deliverToContact(primary, 'WearGuard Emergency Alert', message, {
        allowSms: true,
        allowCall: Boolean(cfg.allowCall),
        openAll: Boolean(cfg.openAllChannels),
      })
    : [];
  const sentAny = relayResult.delivered || deliveredChannels.length > 0;

  if (!sentAny) {
    state.alertActive = false;
    setPanicUiState(false);
    updateBanner();
    showToast('No real delivery route is configured yet.', 'amber');
    logEvent({
      title: 'Emergency alert failed',
      detail: 'Add WhatsApp, email, or phone details to send alerts.',
      icon: 'fas fa-triangle-exclamation',
      accent: '#F0A03A',
    });
    return;
  }

  const recipient = primary.name;
  const channelSummary = relayResult.delivered ? 'secure relay' : deliveredChannels.join(', ');
  const locationSummary = location ? ` Location: ${formatLocationText(location)}.` : ' Location unavailable.';
  logEvent({
    title: 'Emergency alert sent',
    detail: `${reason} Delivered via ${channelSummary || 'contact route'} to ${recipient}.${locationSummary}`,
    icon: 'fas fa-siren-on',
    accent: '#D65A3F',
  });
  showToast(`Emergency alert sent via ${channelSummary || 'contact route'}.`, 'coral');
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
  if (!isWearableConnected()) {
    showToast('Connect a watch first to simulate live heart-rate spikes.', 'amber');
    return;
  }

  state.heartRate = 138 + Math.floor(Math.random() * 20);
  state.wearable.lastSyncAt = new Date().toISOString();
  updateHRDisplay();
  updateWearableUi();
  logEvent({ title: 'High heart rate detected', detail: `${state.heartRate} BPM - stress event flagged.`, icon: 'fas fa-heartbeat', accent: '#D65A3F' });
  showToast(`Heart rate spike: ${state.heartRate} BPM`, 'coral');
  setTimeout(() => {
    if (!isWearableConnected()) return;
    state.heartRate = 72 + Math.floor(Math.random() * 20);
    state.wearable.lastSyncAt = new Date().toISOString();
    updateHRDisplay();
    updateWearableUi();
  }, 6000);
}

function updateHRDisplay() {
  const hrNumber = document.getElementById('hrNumber');
  const bar = document.getElementById('hrBar');
  const hrChipValue = document.getElementById('hrChipVal');
  const hrChipIcon = document.getElementById('hrChip').querySelector('i');
  const simBtn = document.getElementById('hrSimBtn');

  if (!hrNumber || !bar || !hrChipValue || !hrChipIcon || !simBtn) return;

  if (!isWearableConnected()) {
    const waitingStatus = state.wearable.status;
    hrNumber.textContent = waitingStatus === 'syncing' ? '..' : '--';
    hrNumber.className = 'hr-number offline';
    bar.style.width = waitingStatus === 'syncing' ? '34%' : waitingStatus === 'pairing' ? '22%' : waitingStatus === 'scanning' ? '14%' : '6%';
    bar.className = 'hr-bar muted';
    hrChipValue.textContent = waitingStatus === 'scanning'
      ? 'Scanning...'
      : waitingStatus === 'selecting'
        ? 'Choose watch'
        : waitingStatus === 'pairing'
          ? 'Pairing...'
          : waitingStatus === 'syncing'
            ? 'Syncing sensor'
            : 'Watch offline';
    hrChipIcon.style.color = 'rgba(22,59,53,.35)';
    simBtn.disabled = true;
    simBtn.innerHTML = '<i class="fas fa-tower-broadcast"></i> Connect a watch to simulate a stress event';
    return;
  }

  const high = state.heartRate >= 132;
  const pct = Math.min(100, Math.max(5, ((state.heartRate - 40) / 100) * 100));
  hrNumber.textContent = state.heartRate;
  hrNumber.className = 'hr-number' + (high ? ' high' : '');
  bar.style.width = pct + '%';
  bar.className = 'hr-bar' + (high ? ' high' : '');
  hrChipValue.textContent = state.heartRate + ' BPM';
  hrChipIcon.style.color = high ? '#D65A3F' : '#F0A03A';
  simBtn.disabled = false;
  simBtn.innerHTML = '<i class="fas fa-bolt"></i> Simulate high heart rate (stress event)';
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

function handleContactsListClick(event) {
  const actionButton = event.target.closest('button[data-contact-action]');
  if (!actionButton) return;

  const contactId = Number(actionButton.getAttribute('data-contact-id'));
  if (!Number.isFinite(contactId)) return;

  if (actionButton.getAttribute('data-contact-action') === 'primary') {
    setPrimary(contactId);
    return;
  }

  if (actionButton.getAttribute('data-contact-action') === 'remove') {
    removeContact(contactId);
  }
}

function renderContacts() {
  const ul = document.getElementById('contactsList');
  if (!ul) return;

  ul.replaceChildren();
  if (!state.contacts.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'settings-empty';
    emptyItem.textContent = 'No contacts yet - add one above.';
    ul.appendChild(emptyItem);
    return;
  }

  state.contacts.forEach(c => {
    const li = document.createElement('li');
    const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const detail = [c.phone, c.whatsapp ? `WA: ${c.whatsapp}` : '', c.email].filter(Boolean).join(' - ');

    const avatar = document.createElement('div');
    avatar.className = `contact-avatar${c.primary ? ' primary' : ''}`;
    avatar.textContent = initials;

    const info = document.createElement('div');
    info.className = 'contact-info';

    const nameRow = document.createElement('div');
    nameRow.className = 'contact-name';
    nameRow.append(document.createTextNode(c.name + ' '));

    const badge = document.createElement('span');
    badge.className = `primary-badge${c.primary ? ' show' : ''}`;
    badge.textContent = 'Primary';
    nameRow.appendChild(badge);

    const detailRow = document.createElement('div');
    detailRow.className = 'contact-detail';
    detailRow.textContent = detail || 'No details';

    info.appendChild(nameRow);
    info.appendChild(detailRow);

    const actions = document.createElement('div');
    actions.className = 'contact-actions';

    const primaryButton = document.createElement('button');
    primaryButton.type = 'button';
    primaryButton.className = `icon-btn star${c.primary ? ' active' : ''}`;
    primaryButton.title = 'Set as primary';
    primaryButton.setAttribute('data-contact-action', 'primary');
    primaryButton.setAttribute('data-contact-id', String(c.id));

    const primaryIcon = document.createElement('i');
    primaryIcon.className = 'fas fa-star';
    primaryButton.appendChild(primaryIcon);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'icon-btn del';
    removeButton.title = 'Remove';
    removeButton.setAttribute('data-contact-action', 'remove');
    removeButton.setAttribute('data-contact-id', String(c.id));

    const removeIcon = document.createElement('i');
    removeIcon.className = 'fas fa-trash';
    removeButton.appendChild(removeIcon);

    actions.appendChild(primaryButton);
    actions.appendChild(removeButton);

    li.appendChild(avatar);
    li.appendChild(info);
    li.appendChild(actions);
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
  const cfg = options || {};
  const location = cfg.location || await getCurrentLocation();
  const payload = buildLocationPayload(contact, location, context || {});
  const relayResult = await dispatchSecurePayload('location', payload);
  const message = buildLocationMessage(contact, payload);
  const deliveredChannels = !relayResult.delivered && cfg.openRoutes && contact
    ? deliverToContact(contact, 'WearGuard Location Update', message, {
        allowSms: true,
        allowCall: false,
        openAll: Boolean(cfg.openAllChannels),
      })
    : [];

  return {
    location,
    payload,
    relayDelivered: relayResult.delivered,
    relayMode: relayResult.mode,
    relayMessage: relayResult.message,
    deliveredChannels,
    sentAny: relayResult.delivered || deliveredChannels.length > 0,
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
  const cid = document.getElementById('shareContactSelect').value;
  const mins = parseInt(document.getElementById('shareDurationSelect').value, 10);
  if (!cid) { showToast('Select a contact to share with.', 'amber'); return; }

  const contact = state.contacts.find(c => c.id == cid);
  if (!contact) return;
  if (!hasReachableContactRoute(contact)) {
    showToast('Add WhatsApp, email, or phone details first.', 'amber');
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
    showToast('No real delivery route is configured yet.', 'amber');
    return;
  }

  state.lastLocationSentAt = Date.now();
  const startSummary = initialResult.relayDelivered ? 'secure relay' : initialResult.deliveredChannels.join(', ');
  const continuousNote = 'manual updates only';
  updateShareStatus(true, `Sharing with ${contact.name} - ${continuousNote}`);
  showToast(`Location sent via ${startSummary || 'contact route'}.`, 'teal');
  logEvent({
    title: 'Location sharing started',
    detail: `Real location sent to ${contact.name} via ${startSummary || 'contact route'}. ${continuousNote}.`,
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
    const suffix = `manual updates only - ${minsRemaining}m left`;
    updateShareStatus(true, `Sharing with ${contact.name} - ${suffix}`);
  }, 15000);
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
  const cid = document.getElementById('shareContactSelect').value;
  if (!cid) { showToast('Select a contact first.', 'amber'); return; }

  const contact = state.contacts.find(c => c.id == cid);
  if (!contact) return;
  if (!hasReachableContactRoute(contact)) {
    showToast('Add WhatsApp, email, or phone details first.', 'amber');
    return;
  }

  try {
    const result = await sendLocationPayload(contact, {
      mode: 'single',
      reason: 'One-time live location update.',
      minutes: 0,
    }, {
      openRoutes: true,
    });

    if (!result.sentAny) {
      showToast('No real delivery route is configured yet.', 'amber');
      return;
    }

    const channelSummary = result.relayDelivered ? 'secure relay' : result.deliveredChannels.join(', ');
    showToast(`Location sent via ${channelSummary || 'contact route'}.`, 'teal');
    logEvent({
      title: 'Location sent',
      detail: `Real location delivered to ${contact.name} via ${channelSummary || 'contact route'}.`,
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
  } else if (!isWearableConnected()) {
    banner.classList.add('offline');
    icon.innerHTML = '<i class="fas fa-tower-broadcast"></i>';
    label.textContent = ['scanning', 'selecting', 'pairing', 'syncing'].includes(state.wearable.status)
      ? 'CONNECTING WATCH'
      : 'WATCH OFFLINE';
    text.textContent = ['scanning', 'selecting', 'pairing', 'syncing'].includes(state.wearable.status)
      ? 'Bluetooth pairing is in progress. Live heart-rate monitoring will start when the watch finishes syncing.'
      : 'Pair a Bluetooth watch to start live heart-rate monitoring. Safety AI can still listen from this device.';
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
  if (!list) return;

  list.replaceChildren();

  state.events.forEach((ev) => {
    const row = document.createElement('div');
    row.className = 'event-row';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'event-icon-wrap';
    iconWrap.style.background = accent20(ev.accent);
    iconWrap.style.color = ev.accent;

    const icon = document.createElement('i');
    icon.className = ev.icon;
    iconWrap.appendChild(icon);

    const body = document.createElement('div');
    body.className = 'event-body';

    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = ev.title;

    const detail = document.createElement('div');
    detail.className = 'event-detail';
    detail.textContent = ev.detail;

    const time = document.createElement('div');
    time.className = 'event-time';
    time.textContent = formatTime(ev.time);

    body.appendChild(title);
    body.appendChild(detail);
    body.appendChild(time);

    row.appendChild(iconWrap);
    row.appendChild(body);
    list.appendChild(row);
  });
}

function accent20(hex) {
  return hex + '22';
}

function formatTime(d) {
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* â”€â”€ CARD TOGGLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toggleCard(id) {
  const card = document.getElementById(id);
  if (!card) return;

  card.classList.toggle('open');

  const header = card.querySelector('[data-card-target]');
  if (header) {
    header.setAttribute('aria-expanded', card.classList.contains('open') ? 'true' : 'false');
  }
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
  updateWearableUi();
  updateHRDisplay();
  updateBanner();
  updateChips();
  updateVoiceUI();
  renderContacts();
  updateShareContactSelect();
  renderEvents();
  updateDeviceAccessUi();
  renderSecurityModule();
}
