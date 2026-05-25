require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const sessionRouter = require('./routes/session');
const dispatchRouter = require('./routes/dispatch');
const cyberDispatchRouter = require('./routes/cyber-dispatch');

const app = express();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required before starting the WearGuard server.');
}

// Railway and similar platforms terminate TLS before forwarding traffic to Node.
app.set('trust proxy', 1);

// Core request middleware.
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Session middleware for secure device restoration and dispatch authorization.
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: IS_PRODUCTION,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS_MS,
  },
}));

// Static frontend hosting.
app.use(express.static(PUBLIC_DIR));

// API routes.
app.use('/api/session', sessionRouter);
app.use('/api/dispatch', dispatchRouter);
app.use('/api/cyber-dispatch', cyberDispatchRouter);

// Single-page app fallback.
app.get('*', (req, res) => {
  res.sendFile(INDEX_FILE);
});

app.listen(PORT, () => {
  console.log(`WearGuard server listening on port ${PORT}.`);
});
