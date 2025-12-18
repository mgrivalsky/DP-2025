const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database/db');

// Lightweight logger for this router
const log = (...args) => console.log(new Date().toISOString(), '[auth]', ...args);

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    log('Login attempt', { email });

    // 1) Uzivatel
    const userResult = await pool.query(
      'SELECT id_uzivatela AS id, email, heslo, meno, priezvisko, typ_uzivatela AS role FROM Uzivatel WHERE email = $1',
      [email]
    );
    log('Uzivatel lookup', { email, found: userResult.rows.length });

    if (userResult.rows.length > 0) {
      const u = userResult.rows[0];
      // Heslá sú v seedoch v plaintexte, porovnávame priamo
      if (password === u.heslo) {
        log('Login success Uzivatel', { userId: u.id, role: u.role });
        return res.json({
          user: {
            id: u.id,
            email: u.email,
            name: `${u.meno} ${u.priezvisko}`,
            role: u.role
          }
        });
      }
    }

    // 2) Psychologicka
    const psychResult = await pool.query(
      'SELECT id_psychologicky AS id, email, heslo, meno, priezvisko FROM Psychologicka WHERE email = $1',
      [email]
    );
    log('Psychologicka lookup', { email, found: psychResult.rows.length });

    if (psychResult.rows.length > 0) {
      const p = psychResult.rows[0];
      if (password === p.heslo) {
        log('Login success Psychologicka', { userId: p.id, role: 'psycholog' });
        return res.json({
          user: {
            id: p.id,
            email: p.email,
            name: `${p.meno} ${p.priezvisko}`,
            role: 'psycholog'
          }
        });
      }
    }

    log('Login failed – wrong credentials', { email });
    return res.status(401).json({ error: 'Nesprávny email alebo heslo' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// Register
// Register vypneme v tokenless, statickom režime
router.post('/register', (req, res) => {
  return res.status(403).json({ error: 'Registrácia je vypnutá v tomto režime' });
});

module.exports = router;
