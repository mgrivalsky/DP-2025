const express = require('express');
const router = express.Router();

const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const roleLower = (role) => String(role || '').toLowerCase();

// POST /api/expert/step4
// Uloží záznam, že študent prešiel expertný systém až po krok 4.
// Body: { problemType: string }
router.post('/step4', async (req, res) => {
  try {
    const authed = Number(req.user?.id);
    const role = roleLower(req.user?.role);
    if (!authed) return res.status(401).json({ error: 'Prihlásenie je povinné' });
    if (role === 'psycholog') {
      return res.status(403).json({ error: 'Endpoint nie je určený pre psychológa' });
    }

    const problemTypeRaw = req.body?.problemType;
    const problemType = String(problemTypeRaw || '').trim();

    if (!problemType) {
      return res.status(400).json({ error: 'Pole "problemType" je povinné' });
    }

    const inserted = await pool.query(
      `INSERT INTO expetny_system (typ_problemu)
       VALUES ($1)
       RETURNING id_dokoncenia, datum_cas, typ_problemu`,
      [problemType]
    );

    return res.status(201).json({ ok: true, row: inserted.rows?.[0] });
  } catch (error) {
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    const payload = { error: 'Chyba servera' };

    if (!isProd) {
      payload.code = error?.code;
      payload.message = error?.message;

      // Common case: DB schema not migrated
      if (String(error?.code || '') === '42P01') {
        payload.hint = 'Chýba tabuľka expetny_system. Spusťte database/schema.sql (alebo CREATE TABLE časť).';
      }
    }

    return res.status(500).json(payload);
  }
});

module.exports = router;
