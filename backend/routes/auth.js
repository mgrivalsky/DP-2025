const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const passport = require('passport');

const { authenticateToken } = require('../middleware/auth');

function parseAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => String(e || '').trim().toLowerCase())
    .filter(Boolean);
}

function frontendBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

function userTypeFromEmail(email) {
  const emailNorm = String(email || '').trim().toLowerCase();
  return emailNorm.endsWith('@spseke.sk') ? 'ucitel' : 'student';
}

async function ensurePsychologByEmail({ email, givenName, familyName }) {
  const emailNorm = String(email || '').trim().toLowerCase();
  const existing = await pool.query(
    'SELECT id_psychologa AS id, meno, priezvisko, email FROM Psycholog WHERE LOWER(email) = $1 LIMIT 1',
    [emailNorm]
  );
  if (existing.rows[0]) {
    // Mark psychologist as online on successful OAuth login
    await pool.query('UPDATE Psycholog SET je_online = true WHERE id_psychologa = $1', [existing.rows[0].id]);
    return existing.rows[0];
  }

  // App-wide assumption: psychologist is often referenced as id_psychologa = 1.
  // If a single psychologist is used, keep the identity stable at ID=1.
  const idOne = await pool.query(
    'SELECT id_psychologa AS id, meno, priezvisko, email FROM Psycholog WHERE id_psychologa = 1 LIMIT 1'
  );
  if (idOne.rows[0]) {
    const updated = await pool.query(
      `UPDATE Psycholog
         SET email = $1,
             meno = COALESCE(NULLIF($2, ''), meno),
             priezvisko = COALESCE(NULLIF($3, ''), priezvisko),
             je_online = true
       WHERE id_psychologa = 1
       RETURNING id_psychologa AS id, meno, priezvisko, email`,
      [emailNorm, givenName || '', familyName || '']
    );
    return updated.rows[0];
  }

  const insert = await pool.query(
    `INSERT INTO Psycholog (meno, priezvisko, email, je_online)
     VALUES ($1, $2, $3, true)
     RETURNING id_psychologa AS id, meno, priezvisko, email`,
    [givenName || '', familyName || '', emailNorm]
  );
  return insert.rows[0];
}

async function ensureUserByEmail({ email, givenName, familyName }) {
  const emailNorm = String(email || '').trim().toLowerCase();
  const desiredRole = userTypeFromEmail(emailNorm);
  const existing = await pool.query(
    'SELECT id_uzivatela AS id, meno, priezvisko, email, typ_uzivatela AS role FROM Uzivatel WHERE LOWER(email) = $1 LIMIT 1',
    [emailNorm]
  );
  if (existing.rows[0]) {
    const currentRole = String(existing.rows[0].role || '').trim().toLowerCase();
    if (currentRole && currentRole !== desiredRole) {
      const updated = await pool.query(
        `UPDATE Uzivatel
            SET typ_uzivatela = $1
          WHERE id_uzivatela = $2
          RETURNING id_uzivatela AS id, meno, priezvisko, email, typ_uzivatela AS role`,
        [desiredRole, existing.rows[0].id]
      );
      return updated.rows[0] || { ...existing.rows[0], role: desiredRole };
    }
    return existing.rows[0];
  }

  const insert = await pool.query(
    `INSERT INTO Uzivatel (meno, priezvisko, email, typ_uzivatela)
     VALUES ($1, $2, $3, $4)
     RETURNING id_uzivatela AS id, meno, priezvisko, email, typ_uzivatela AS role`,
    [givenName || '', familyName || '', emailNorm, desiredRole]
  );
  return insert.rows[0];
}

// GET /api/auth/google
router.get(
  '/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
      return res.status(500).json({
        error: 'Google OAuth nie je nakonfigurovaný (chýbajú env premenné).'
      });
    }
    return next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${frontendBaseUrl()}/login?oauth=failed` }),
  async (req, res) => {
    try {
      if (!process.env.JWT_SECRET) {
        return res.status(500).send('JWT_SECRET nie je nastavený');
      }

      const email = req.user?.email;
      const givenName = req.user?.givenName || '';
      const familyName = req.user?.familyName || '';
      if (!email) {
        return res.redirect(`${frontendBaseUrl()}/login?oauth=missing_email`);
      }

      const admins = parseAdminEmails();
      const emailLower = String(email).toLowerCase();
      const isAdmin = admins.includes(emailLower);

      let userPayload;
      if (isAdmin) {
        const p = await ensurePsychologByEmail({ email, givenName, familyName });
        userPayload = {
          id: p.id,
          email: p.email,
          role: 'psycholog'
        };

        // Broadcast psychologist online status (best-effort)
        try {
          const io = req.app?.get('io');
          if (io) io.emit('psychologStatus', { id: p.id, online: true });
        } catch {
          // ignore
        }
      } else {
        const u = await ensureUserByEmail({ email, givenName, familyName });
        userPayload = {
          id: u.id,
          email: u.email,
          role: u.role || 'student'
        };
      }

      const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.redirect(`${frontendBaseUrl()}/oauth-callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Google callback error:', error);
      const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
      const code = String(error?.code || '').trim();
      const codeSuffix = !isProd && code ? `&code=${encodeURIComponent(code)}` : '';
      return res.redirect(`${frontendBaseUrl()}/login?oauth=server_error${codeSuffix}`);
    }
  }
);

// POST /api/auth/logout
// If a psychologist logs out, mark them offline.
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    const id = Number(req.user?.id);

    if ((role === 'psycholog' || role === 'admin') && id) {
      await pool.query('UPDATE Psycholog SET je_online = false WHERE id_psychologa = $1', [id]);

      // Broadcast psychologist offline status (best-effort)
      try {
        const io = req.app?.get('io');
        if (io) io.emit('psychologStatus', { id, online: false });
      } catch {
        // ignore
      }
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

// GET /api/auth/me
// Returns the full user profile used by frontend (id/email/name/role)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.user?.id);
    const role = String(req.user?.role || '').toLowerCase();
    if (!id) return res.status(401).json({ error: 'Prihlásenie je povinné' });

    if (role === 'psycholog' || role === 'admin') {
      const q = await pool.query(
        'SELECT id_psychologa AS id, email, meno, priezvisko FROM Psycholog WHERE id_psychologa = $1',
        [id]
      );
      if (!q.rows[0]) return res.status(404).json({ error: 'Psycholog nenájdený' });
      const p = q.rows[0];
      return res.json({
        user: {
          id: p.id,
          email: p.email,
          name: `${p.meno || ''} ${p.priezvisko || ''}`.trim(),
          role: 'psycholog'
        }
      });
    }

    const q = await pool.query(
      'SELECT id_uzivatela AS id, email, meno, priezvisko, typ_uzivatela AS role FROM Uzivatel WHERE id_uzivatela = $1',
      [id]
    );
    if (!q.rows[0]) return res.status(404).json({ error: 'Užívateľ nenájdený' });
    const u = q.rows[0];
    return res.json({
      user: {
        id: u.id,
        email: u.email,
        name: `${u.meno || ''} ${u.priezvisko || ''}`.trim(),
        role: u.role || 'student'
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

module.exports = router;
