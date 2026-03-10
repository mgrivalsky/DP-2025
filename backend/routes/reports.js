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
       WHERE r.id_psychologicky = $1
         AND r.datum >= $2::date
         AND r.datum < ($2::date + INTERVAL '1 month')
       GROUP BY r.datum
       ORDER BY r.datum ASC`,
      [psychologId, startDate]
    );

    const messagesCountQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Sprava s
       JOIN Chat c ON c.id_chatu = s.id_chatu
       WHERE c.id_psychologicky = $1
         AND s.cas_odoslania >= $2::date
         AND s.cas_odoslania < ($2::date + INTERVAL '1 month')`,
      [psychologId, startDate]
    );

    const trustCountQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Schranka_dovery sd
       WHERE (sd.id_psychologicky = $1 OR sd.id_psychologicky IS NULL)
         AND sd.datum_pridania >= $2::date
         AND sd.datum_pridania < ($2::date + INTERVAL '1 month')`,
      [psychologId, startDate]
    );

    const trustByCategoryQ = pool.query(
      `SELECT COALESCE(NULLIF(TRIM(sd.kategoria), ''), 'Neznáma') AS kategoria,
              COUNT(*)::int AS count
       FROM Schranka_dovery sd
       WHERE (sd.id_psychologicky = $1 OR sd.id_psychologicky IS NULL)
         AND sd.datum_pridania >= $2::date
         AND sd.datum_pridania < ($2::date + INTERVAL '1 month')
       GROUP BY COALESCE(NULLIF(TRIM(sd.kategoria), ''), 'Neznáma')
       ORDER BY count DESC, kategoria ASC`,
      [psychologId, startDate]
    );

    const [reservationsByDate, messagesCount, trustCount, trustByCategory] = await Promise.all([
      reservationsByDateQ,
      messagesCountQ,
      trustCountQ,
      trustByCategoryQ
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
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

module.exports = router;
