function requireSession(req, res, next) {
  try {
    if (req.session && req.session.profile && req.session.storageKey) {
      return next();
    }

    return res.status(401).json({ error: 'No active session.' });
  } catch (error) {
    console.error('Session authorization failed:', error);
    return res.status(500).json({ error: 'Session authorization failed.' });
  }
}

module.exports = requireSession;
