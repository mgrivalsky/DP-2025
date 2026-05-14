const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { encryptText, decryptFields } = require('../utils/fieldCrypto');

const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const roleLower = (role) => String(role || '').toLowerCase();
const isPsycholog = (role) => roleLower(role) === 'psycholog' || roleLower(role) === 'admin';

function decryptReservationRow(row) {
  return decryptFields(row, ['poznamka']);
}

function emitReservationUpdate(req, psychologId) {
  try {
    const io = req.app?.get('io');
    if (!io) return;
    const id = Number(psychologId);
    if (id) {
      io.to(`psycholog:${id}`).emit('reservationUpdated', { psychologId: id });
    }
    io.to('role:psycholog').emit('reservationUpdated', { psychologId: id || null });
  } catch {
    // ignore
  }
}

// Rezervácie sú chránené tokenom. Užívateľ vidí iba svoje záznamy.

// Pomocná funkcia na zistenie id_uzivatela
async function resolveUserId({ id_uzivatela, email }) {
  if (id_uzivatela) return id_uzivatela;
  if (email) {
    const u = await pool.query('SELECT id_uzivatela FROM Uzivatel WHERE email = $1', [email]);
    if (u.rows[0]) return u.rows[0].id_uzivatela;
  }
  // fallback na testovacieho učiteľa, ak existuje
  const fallback = await pool.query("SELECT id_uzivatela FROM Uzivatel WHERE email = 'ucitel@skolka.sk' LIMIT 1");
  return fallback.rows[0]?.id_uzivatela || null;
}

// 1) Vytvorenie rezervácie
router.post('/', async (req, res) => {
  try {
    const { datum, cas_od, cas_do, poznamka, id_psychologa, id_uzivatela, email, stav } = req.body;
    const psychologId = id_psychologa;

    if (!datum || !cas_od) {
      return res.status(400).json({ error: 'Chýba povinné pole: datum alebo cas_od' });
    }

    const userId = isPsycholog(req.user?.role)
      ? await resolveUserId({ id_uzivatela, email })
      : Number(req.user?.id);
    if (!userId) return res.status(400).json({ error: 'Nedá sa určiť užívateľ (zadajte id_uzivatela alebo email)' });

    const result = await pool.query(
      `INSERT INTO Rezervacia_sedeni (datum, cas_od, cas_do, poznamka, id_psychologa, id_uzivatela, stav, videne_psychologom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING id_sedenia,
                 datum::text AS datum,
                 cas_od,
                 cas_do,
                 stav,
                 poznamka,
                 videne_psychologom,
                 id_psychologa,
                 id_uzivatela`,
      [datum, cas_od, cas_do || cas_od, encryptText(poznamka || null), psychologId || 1, userId, stav || 'vytvorena']
    );

    const created = decryptReservationRow(result.rows[0]);
    emitReservationUpdate(req, created?.id_psychologa);
    res.status(201).json({ message: 'OK', reservation: created });
  } catch (error) {
    // Zachyť porušenie unikátneho indexu na (datum, cas_od, id_psychologa)
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Tento termín je už obsadený' });
    }
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 1b) Počet nevidených rezervácií (psycholog)
router.get('/psycholog/:psychologId/unseen-count', async (req, res) => {
  try {
    const psychologId = parseInt(req.params.psychologId, 10);
    if (!psychologId) {
      return res.status(400).json({ error: 'psychologId je povinne' });
    }

    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }
    if (Number(psychologId) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM Rezervacia_sedeni WHERE id_psychologa = $1 AND videne_psychologom = false',
      [psychologId]
    );
    return res.json({ count: result.rows[0]?.count || 0 });
  } catch (error) {
    console.error('Unseen reservations count error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 1c) Označiť všetky rezervácie ako videné (psycholog)
router.put('/psycholog/:psychologId/mark-seen', async (req, res) => {
  try {
    const psychologId = parseInt(req.params.psychologId, 10);
    if (!psychologId) {
      return res.status(400).json({ error: 'psychologId je povinne' });
    }

    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }
    if (Number(psychologId) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    await pool.query(
      'UPDATE Rezervacia_sedeni SET videne_psychologom = true WHERE id_psychologa = $1 AND videne_psychologom = false',
      [psychologId]
    );
    emitReservationUpdate(req, psychologId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Mark reservations seen error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 1d) Počet potvrdených sedení (užívateľ)
router.get('/user/:userId/confirmed-count', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ error: 'userId je povinne' });
    }

    if (isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }
    if (Number(userId) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Rezervacia_sedeni
       WHERE id_uzivatela = $1
         AND LOWER(TRIM(stav)) = 'potvrdena'`,
      [userId]
    );

    return res.json({ count: result.rows[0]?.count || 0 });
  } catch (error) {
    console.error('Confirmed reservations count error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 2) Vypísať všetky rezervácie
router.get('/', async (req, res) => {
  try {
    if (isPsycholog(req.user?.role)) {
      const result = await pool.query(`
        SELECT r.id_sedenia, r.datum::text AS datum, r.cas_od, r.cas_do, r.stav, r.poznamka, r.videne_psychologom,
               r.id_psychologa, p.meno as psycholog_meno, p.priezvisko as psycholog_priezvisko,
               r.id_uzivatela, u.meno as uzivatel_meno, u.priezvisko as uzivatel_priezvisko, u.email as uzivatel_email
        FROM Rezervacia_sedeni r
        LEFT JOIN Uzivatel u ON u.id_uzivatela = r.id_uzivatela
        LEFT JOIN Psycholog p ON p.id_psychologa = r.id_psychologa
        ORDER BY r.datum DESC, r.cas_od DESC
      `);
      return res.json((result.rows || []).map(decryptReservationRow));
    }

    const result = await pool.query(`
      SELECT r.id_sedenia, r.datum::text AS datum, r.cas_od, r.cas_do, r.stav, r.poznamka,
             r.id_psychologa, p.meno as psycholog_meno, p.priezvisko as psycholog_priezvisko,
             r.id_uzivatela
      FROM Rezervacia_sedeni r
      LEFT JOIN Psycholog p ON p.id_psychologa = r.id_psychologa
      WHERE r.id_uzivatela = $1
      ORDER BY r.datum DESC, r.cas_od DESC
    `, [req.user.id]);
    return res.json((result.rows || []).map(decryptReservationRow));
  } catch (error) {
    console.error('List reservations error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 3) Zmazať všetky rezervácie
router.delete('/', async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }
    const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM Rezervacia_sedeni');
    await pool.query('TRUNCATE TABLE Rezervacia_sedeni RESTART IDENTITY');
    res.json({ message: 'Všetky rezervácie zmazané', deleted: countRes.rows[0].cnt });
  } catch (error) {
    console.error('Delete all reservations error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 4) Upraviť rezerváciu (PATCH)
router.patch('/:id', async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }
    const { id } = req.params;
    const { stav, poznamka, datum, cas_od, cas_do } = req.body;

    // Zistit aktualne hodnoty
    const current = await pool.query('SELECT * FROM Rezervacia_sedeni WHERE id_sedenia = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Rezervácia nenájdená' });
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (stav !== undefined) {
      updates.push(`stav = $${paramCount}`);
      params.push(stav);
      paramCount++;
    }
    if (poznamka !== undefined) {
      updates.push(`poznamka = $${paramCount}`);
      params.push(encryptText(poznamka));
      paramCount++;
    }
    if (datum !== undefined) {
      updates.push(`datum = $${paramCount}`);
      params.push(datum);
      paramCount++;
    }
    if (cas_od !== undefined) {
      updates.push(`cas_od = $${paramCount}`);
      params.push(cas_od);
      paramCount++;
    }
    if (cas_do !== undefined) {
      updates.push(`cas_do = $${paramCount}`);
      params.push(cas_do);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Žiadne pole na úpravu' });
    }

    params.push(id);
    const sql = `UPDATE Rezervacia_sedeni
                 SET ${updates.join(', ')}
                 WHERE id_sedenia = $${paramCount}
                 RETURNING id_sedenia,
                           datum::text AS datum,
                           cas_od,
                           cas_do,
                           stav,
                           poznamka,
                           videne_psychologom,
                           id_psychologa,
                           id_uzivatela`;
    const result = await pool.query(sql, params);
    const updated = decryptReservationRow(result.rows[0]);
    emitReservationUpdate(req, updated?.id_psychologa);
    res.json({ message: 'OK', reservation: updated });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Tento termín je už obsadený' });
    }
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 5) Vymazať jednu rezerváciu
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'id je povinne' });

    const authedId = Number(req.user?.id);
    if (!authedId) return res.status(401).json({ error: 'Prihlásenie je povinné' });

    await client.query('BEGIN');

    const current = await client.query(
      `SELECT id_sedenia, datum, cas_od, cas_do, id_psychologa, id_uzivatela, stav
       FROM Rezervacia_sedeni
       WHERE id_sedenia = $1
       FOR UPDATE`,
      [id]
    );
    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Rezervácia nenájdená' });
    }

    const reservation = current.rows[0];
    const canAdminDelete = isPsycholog(req.user?.role);
    const isOwner = Number(reservation.id_uzivatela) === authedId;
    if (!canAdminDelete && !isOwner) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const deletedRes = await client.query(
      'DELETE FROM Rezervacia_sedeni WHERE id_sedenia = $1 RETURNING *',
      [id]
    );

    // Free the corresponding time slot again (best-effort).
    // Prefer matching by (psycholog, datum, cas_od, cas_do); if no row updated, fall back to (psycholog, datum, cas_od).
    let freed = 0;
    try {
      const tryFull = await client.query(
        `UPDATE Cas_slot
            SET volny = true
          WHERE id_psychologa = $1
            AND datum = $2
            AND cas_od = $3
            AND cas_do = $4`,
        [reservation.id_psychologa, reservation.datum, reservation.cas_od, reservation.cas_do]
      );
      freed = Number(tryFull.rowCount || 0);
    } catch {
      // ignore
    }

    if (!freed) {
      try {
        const tryPartial = await client.query(
          `UPDATE Cas_slot
              SET volny = true
            WHERE id_psychologa = $1
              AND datum = $2
              AND cas_od = $3`,
          [reservation.id_psychologa, reservation.datum, reservation.cas_od]
        );
        freed = Number(tryPartial.rowCount || 0);
      } catch {
        // ignore
      }
    }

    await client.query('COMMIT');
    emitReservationUpdate(req, reservation?.id_psychologa);
    return res.json({ message: 'Rezervácia zrušená', deleted: decryptReservationRow(deletedRes.rows[0]), freedSlots: freed });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    console.error('Delete reservation error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  } finally {
    client.release();
  }
});

module.exports = router;
