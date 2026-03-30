const express = require('express');
const router = express.Router();

const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const roleLower = (role) => String(role || '').toLowerCase();
const isPsycholog = (role) => roleLower(role) === 'psycholog' || roleLower(role) === 'admin';

function parseMonthParam(month) {
  const m = String(month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(m)) return null;
  const [yStr, moStr] = m.split('-');
  const year = Number(yStr);
  const monthNum = Number(moStr);
  if (!Number.isInteger(year) || !Number.isInteger(monthNum)) return null;
  if (year < 2000 || year > 2100) return null;
  if (monthNum < 1 || monthNum > 12) return null;
  return { month: m, startDate: `${m}-01` };
}

// GET /api/reports/monthly?month=YYYY-MM
// Report obsahuje:
// - počet sedení v mesiaci podľa dátumu
// - počet správ v mesiaci
// - počet príspevkov do schránky dôvery v mesiaci
// - počet príspevkov do schránky dôvery podľa kategórie (typu problému)
// - použitia expertného systému v mesiaci
router.get('/monthly', async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const parsed = parseMonthParam(req.query.month);
    if (!parsed) {
      return res.status(400).json({ error: 'Param "month" je povinný vo formáte YYYY-MM' });
    }

    const psychologId = Number(req.user?.id);
    if (!psychologId) {
      return res.status(401).json({ error: 'Prihlásenie je povinné' });
    }

    const { month, startDate } = parsed;

    const reservationsByDateQ = pool.query(
      `SELECT r.datum::text AS date, COUNT(*)::int AS count
       FROM Rezervacia_sedeni r
       WHERE r.id_psychologa = $1
         AND r.stav = 'dokoncena'
         AND r.datum >= $2::date
         AND r.datum < ($2::date + INTERVAL '1 month')
       GROUP BY r.datum
       ORDER BY r.datum ASC`,
      [psychologId, startDate]
    );

    const expertTotalQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM expetny_system e
       WHERE e.datum_cas >= $1::date
         AND e.datum_cas < ($1::date + INTERVAL '1 month')`,
      [startDate]
    );

    const expertByProblemTypeQ = pool.query(
      `SELECT COALESCE(NULLIF(TRIM(e.typ_problemu), ''), 'Neznámy') AS typ_problemu,
              COUNT(*)::int AS count
       FROM expetny_system e
       WHERE e.datum_cas >= $1::date
         AND e.datum_cas < ($1::date + INTERVAL '1 month')
       GROUP BY COALESCE(NULLIF(TRIM(e.typ_problemu), ''), 'Neznámy')
       ORDER BY count DESC, typ_problemu ASC`,
      [startDate]
    );

    const messagesCountQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Sprava s
       JOIN Chat c ON c.id_chatu = s.id_chatu
       WHERE c.id_psychologa = $1
         AND s.cas_odoslania >= $2::date
         AND s.cas_odoslania < ($2::date + INTERVAL '1 month')`,
      [psychologId, startDate]
    );

    const trustCountQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Schranka_dovery sd
       WHERE (sd.id_psychologa = $1 OR sd.id_psychologa IS NULL)
         AND sd.datum_pridania >= $2::date
         AND sd.datum_pridania < ($2::date + INTERVAL '1 month')`,
      [psychologId, startDate]
    );

    const trustByCategoryQ = pool.query(
      `SELECT COALESCE(NULLIF(TRIM(sd.kategoria), ''), 'Neznáma') AS kategoria,
              COUNT(*)::int AS count
       FROM Schranka_dovery sd
       WHERE (sd.id_psychologa = $1 OR sd.id_psychologa IS NULL)
         AND sd.datum_pridania >= $2::date
         AND sd.datum_pridania < ($2::date + INTERVAL '1 month')
       GROUP BY COALESCE(NULLIF(TRIM(sd.kategoria), ''), 'Neznáma')
       ORDER BY count DESC, kategoria ASC`,
      [psychologId, startDate]
    );

    const [reservationsByDate, messagesCount, trustCount, trustByCategory, expertTotal, expertByProblemType] = await Promise.all([
      reservationsByDateQ,
      messagesCountQ,
      trustCountQ,
      trustByCategoryQ,
      expertTotalQ,
      expertByProblemTypeQ
    ]);

    const byDate = reservationsByDate.rows || [];
    const totalSessions = byDate.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

    return res.json({
      month,
      period: {
        startDate,
        endExclusive: null
      },
      reservations: {
        total: totalSessions,
        byDate
      },
      messages: {
        count: messagesCount.rows?.[0]?.count || 0
      },
      trustBox: {
        count: trustCount.rows?.[0]?.count || 0,
        byCategory: trustByCategory.rows || []
      },
      expertSystem: {
        count: expertTotal.rows?.[0]?.count || 0,
        byProblemType: expertByProblemType.rows || []
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// GET /api/reports/recent-activities?limit=10
// Posledných N aktivít:
// - vyklikanie expertného systému (expetny_system)
// - vytvorenie rezervácie (Rezervacia_sedeni.vytvorene)
// - príspevok do schránky dôvery (Schranka_dovery.datum_pridania)
router.get('/recent-activities', async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    const q = await pool.query(
      `SELECT * FROM (
         SELECT
           'expert'::text AS activity_type,
           e.datum_cas AS ts,
           ('expert:' || e.id_dokoncenia::text) AS id,
           e.id_uzivatela AS user_id,
           CONCAT(u.meno, ' ', u.priezvisko) AS user_name,
           e.typ_problemu AS detail
         FROM expetny_system e
         JOIN Uzivatel u ON u.id_uzivatela = e.id_uzivatela

         UNION ALL

         SELECT
           'reservation'::text AS activity_type,
           r.vytvorene AS ts,
           ('reservation:' || r.id_sedenia::text) AS id,
           r.id_uzivatela AS user_id,
           CONCAT(u.meno, ' ', u.priezvisko) AS user_name,
           NULL::text AS detail
         FROM Rezervacia_sedeni r
         JOIN Uzivatel u ON u.id_uzivatela = r.id_uzivatela

         UNION ALL

         SELECT
           'trustbox'::text AS activity_type,
           sd.datum_pridania AS ts,
           ('trustbox:' || sd.id_prispevku::text) AS id,
           sd.id_uzivatela AS user_id,
           CONCAT(u.meno, ' ', u.priezvisko) AS user_name,
           sd.kategoria AS detail
         FROM Schranka_dovery sd
         JOIN Uzivatel u ON u.id_uzivatela = sd.id_uzivatela
       ) x
       ORDER BY x.ts DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );

    return res.json({ items: q.rows || [] });
  } catch (error) {
    console.error('Recent activities error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

module.exports = router;
