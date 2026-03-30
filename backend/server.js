const express = require('express');
const http = require('http');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const { initPassport } = require('./auth/passport');

const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');
const casSlotRoutes = require('./routes/casSlots');
const trustBoxRoutes = require('./routes/trustBox');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/reports');
const expertRoutes = require('./routes/expert');
const pool = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Passport init (Google OAuth)
let passport;
try {
  passport = initPassport();
} catch (e) {
  // Allow server boot even when OAuth env vars are not set (e.g. during partial setup).
  // OAuth endpoints will fail until env vars are provided.
  console.warn(String(e?.message || e));
  passport = require('passport');
}

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json());

// Session is required for the OAuth redirect handshake
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/cas-slots', casSlotRoutes);
app.use('/api/trust-box', trustBoxRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expert', expertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-psycholog API is running' });
});

// DB health & diagnostics
app.get('/api/health/db', async (req, res) => {
  try {
    const version = await pool.query('select version()');
    const counts = await pool.query(
      `select (select count(*) from pg_catalog.pg_tables where schemaname = current_schema()) as tables_count`
    );
    res.json({
      db: 'ok',
      version: version.rows?.[0]?.version,
      tablesInSchema: Number(counts.rows?.[0]?.tables_count || 0)
    });
  } catch (e) {
    res.status(500).json({ db: 'error', code: e.code, message: e.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Niečo sa pokazilo!' });
});

// Start server
const server = http.createServer(app);

// Socket.io (real-time chat)
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true
  }
});

// Make io accessible from routes (e.g. to broadcast online status)
app.set('io', io);

function roleLower(role) {
  return String(role || '').toLowerCase();
}

function isPsycholog(role) {
  const r = roleLower(role);
  return r === 'psycholog' || r === 'admin';
}

io.use((socket, next) => {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error('missing_token'));
    if (!process.env.JWT_SECRET) return next(new Error('missing_jwt_secret'));
    const user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    socket.user = user;
    return next();
  } catch (e) {
    return next(new Error('invalid_token'));
  }
});

async function ensureChatAccessForSocket(pool, user, chatId) {
  const chatIdNum = parseInt(chatId, 10);
  if (!chatIdNum) return { ok: false, status: 400, error: 'chatId je povinne' };

  const chatRes = await pool.query('SELECT id_uzivatela, id_psychologa FROM Chat WHERE id_chatu = $1', [chatIdNum]);
  if (chatRes.rows.length === 0) return { ok: false, status: 404, error: 'Chat nenájdený' };

  const chat = chatRes.rows[0];
  const authedId = Number(user?.id);
  if (!authedId) return { ok: false, status: 401, error: 'Prihlásenie je povinné' };

  if (isPsycholog(user?.role)) {
    if (Number(chat.id_psychologa) !== authedId) return { ok: false, status: 403, error: 'Nemáte prístup k tomuto chatu' };
  } else {
    if (Number(chat.id_uzivatela) !== authedId) return { ok: false, status: 403, error: 'Nemáte prístup k tomuto chatu' };
  }

  return { ok: true, chatId: chatIdNum, chat };
}

io.on('connection', (socket) => {
  // Role-based rooms for targeted server-side broadcasts
  try {
    const authedId = Number(socket.user?.id);
    if (isPsycholog(socket.user?.role)) {
      socket.join('role:psycholog');
      if (authedId) socket.join(`psycholog:${authedId}`);
    } else {
      socket.join('role:user');
      if (authedId) socket.join(`user:${authedId}`);
    }
  } catch {
    // ignore
  }

  socket.on('joinChat', async ({ chatId }) => {
    try {
      const access = await ensureChatAccessForSocket(pool, socket.user, chatId);
      if (!access.ok) return socket.emit('errorMessage', { type: 'joinChat', error: access.error });
      socket.join(`chat:${access.chatId}`);
      socket.emit('joinedChat', { chatId: access.chatId });
    } catch (e) {
      socket.emit('errorMessage', { type: 'joinChat', error: 'Chyba servera' });
    }
  });

  socket.on('sendMessage', async ({ chatId, obsah }) => {
    try {
      const text = String(obsah || '').trim();
      if (!text) return;

      const access = await ensureChatAccessForSocket(pool, socket.user, chatId);
      if (!access.ok) return socket.emit('errorMessage', { type: 'sendMessage', error: access.error });

      const odesilatel_typ = isPsycholog(socket.user?.role) ? 'psycholog' : 'uzivatel';

      const message = await pool.query(
        `INSERT INTO Sprava (obsah, id_chatu, odesilatel_typ, videne)
         VALUES ($1, $2, $3, false)
         RETURNING *`,
        [text, access.chatId, odesilatel_typ]
      );

      await pool.query('UPDATE Chat SET posledna_sprava = CURRENT_TIMESTAMP WHERE id_chatu = $1', [access.chatId]);

      const payload = message.rows[0];
      io.to(`chat:${access.chatId}`).emit('message', payload);
      io.to(`chat:${access.chatId}`).emit('chatUpdated', { chatId: access.chatId, posledna_sprava: new Date().toISOString() });
    } catch (e) {
      socket.emit('errorMessage', { type: 'sendMessage', error: 'Chyba servera' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API documentation: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the other process or set PORT to a different value.`);
    console.error('Tip (Windows): `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`');
    process.exit(1);
  }
  console.error('❌ Server error:', err);
  process.exit(1);
});
