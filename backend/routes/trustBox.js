const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { encryptText, decryptFields } = require('../utils/fieldCrypto');

const roleLower = (role) => String(role || '').toLowerCase();
const isPsycholog = (role) => roleLower(role) === 'psycholog' || roleLower(role) === 'admin';
const isUser = (role) => !isPsycholog(role);

function emitTrustBoxUpdate(req, payload, { userId } = {}) {
  try {
    const io = req.app?.get('io');
    if (!io) return;
    io.to('role:psycholog').emit('trustBoxUpdated', payload || {});

    const uid = Number(userId);
    if (uid) {
      io.to(`user:${uid}`).emit('trustBoxUpdated', payload || {});
    }
  } catch {
    // ignore
  }
}

function decryptTrustRow(row) {
  return decryptFields(row, ['obsah_prispevku', 'odpoved']);
}

// Submit a trust box message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { kategoria, obsah_prispevku, anonymne = false, publikovatelne = false, id_uzivatela } = req.body || {};

    // Fixne priradený psychológ (id_psychologa = 1) podľa požiadavky
    const id_psychologa = 1;

    if (isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Psycholog nemôže odoslať správu do schránky dôvery' });
    }

    const authedUserId = Number(req.user?.id);
    if (!authedUserId) {
      return res.status(401).json({ error: 'Prihlásenie je povinné pre odoslanie správy' });
    }

    if (!kategoria || !obsah_prispevku) {
      return res.status(400).json({ error: 'Kategória a obsah sú povinné' });
    }
    if (id_uzivatela && Number(id_uzivatela) !== authedUserId) {
      return res.status(403).json({ error: 'Nemôžete odoslať správu za iného užívateľa' });
    }

    const shouldBeAnonymous = anonymne === true;
    const dbUserId = shouldBeAnonymous ? null : authedUserId;

    const insert = await pool.query(
      `INSERT INTO Schranka_dovery (kategoria, obsah_prispevku, anonymne, publikovatelne, id_uzivatela, id_psychologa, videne_psychologom, videne_uzivatelom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, videne_psychologom, videne_uzivatelom, id_uzivatela, id_psychologa, datum_pridania` ,
      [kategoria, encryptText(obsah_prispevku), shouldBeAnonymous, publikovatelne, dbUserId, id_psychologa, false, true]
    );

    const created = decryptTrustRow(insert.rows[0]);
    emitTrustBoxUpdate(req, { action: 'created', id: created?.id_prispevku || null });
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error inserting trust box message:', err);
    return res.status(500).json({ error: 'Chyba servera pri ukladaní správy' });
  }
});

// Get all trust box messages (for admin/psychologist) - CHRÁNENÉ TOKENOM
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (isPsycholog(req.user?.role)) {
      const result = await pool.query(
        `SELECT sd.id_prispevku, sd.kategoria, sd.obsah_prispevku, sd.anonymne, sd.publikovatelne, sd.zverejnene, sd.videne_psychologom, sd.videne_uzivatelom, sd.odpoved,
          sd.id_uzivatela, sd.id_psychologa, sd.datum_pridania,
          CONCAT(u.meno, ' ', u.priezvisko) AS uzivatel_meno
        FROM Schranka_dovery sd
        LEFT JOIN Uzivatel u ON u.id_uzivatela = sd.id_uzivatela
        ORDER BY sd.id_prispevku DESC`
      );
      return res.json((result.rows || []).map(decryptTrustRow));
    }

    const result = await pool.query(
      `SELECT sd.id_prispevku, sd.kategoria, sd.obsah_prispevku, sd.anonymne, sd.publikovatelne, sd.zverejnene, sd.videne_psychologom, sd.videne_uzivatelom, sd.odpoved,
              sd.id_uzivatela, sd.id_psychologa, sd.datum_pridania
       FROM Schranka_dovery sd
       WHERE sd.id_uzivatela = $1
       ORDER BY sd.id_prispevku DESC`,
      [req.user.id]
    );
    return res.json((result.rows || []).map(decryptTrustRow));
  } catch (err) {
    console.error('Error fetching trust box messages:', err);
    return res.status(500).json({ error: 'Chyba servera pri načítaní správ' });
  }
});

// Unseen trust box count (psycholog/admin)
router.get('/unseen-count', authenticateToken, async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Schranka_dovery
       WHERE COALESCE(videne_psychologom, false) = false`
    );
    return res.json({ count: result.rows[0]?.count || 0 });
  } catch (error) {
    console.error('Unseen trust box count error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

// Unseen replies count for a user (videne_uzivatelom = false)
router.get('/user/:userId/unseen-count', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ error: 'userId je povinné' });
    }

    if (!isUser(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }
    if (Number(userId) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM Schranka_dovery
       WHERE id_uzivatela = $1
         AND COALESCE(videne_uzivatelom, true) = false`,
      [userId]
    );

    return res.json({ count: result.rows[0]?.count || 0 });
  } catch (error) {
    console.error('Unseen trust box (user) count error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

// Mark all trust box items as seen (psycholog/admin)
router.put('/mark-seen', authenticateToken, async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    await pool.query(
      `UPDATE Schranka_dovery
       SET videne_psychologom = true
       WHERE COALESCE(videne_psychologom, false) = false`
    );
    emitTrustBoxUpdate(req, { action: 'markSeenAll' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Mark trust box seen error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

// Mark a single trust box item as seen (psycholog/admin)
router.put('/:id/mark-seen', authenticateToken, async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'id je povinné' });
    }

    const update = await pool.query(
      `UPDATE Schranka_dovery
          SET videne_psychologom = true
        WHERE id_prispevku = $1
        RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, zverejnene, videne_psychologom, videne_uzivatelom, odpoved, id_uzivatela, id_psychologa, datum_pridania`,
      [id]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
    }

    emitTrustBoxUpdate(req, { action: 'markSeen', id });
    return res.json(decryptTrustRow(update.rows[0]));
  } catch (error) {
    console.error('Mark single trust box seen error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

// Mark a trust box item as seen by its owner user
router.put('/:id/mark-seen-user', authenticateToken, async (req, res) => {
  try {
    if (!isUser(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie' });
    }

    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'id je povinné' });
    }

    const authedUserId = Number(req.user?.id);
    if (!authedUserId) {
      return res.status(401).json({ error: 'Prihlásenie je povinné' });
    }

    const update = await pool.query(
      `UPDATE Schranka_dovery
          SET videne_uzivatelom = true
        WHERE id_prispevku = $1 AND id_uzivatela = $2
        RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, zverejnene, videne_psychologom, videne_uzivatelom, odpoved, id_uzivatela, id_psychologa, datum_pridania`,
      [id, authedUserId]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
    }

    return res.json(decryptTrustRow(update.rows[0]));
  } catch (error) {
    console.error('Mark trust box seen by user error:', error);
    return res.status(500).json({ error: 'Chyba servera' });
  }
});

// Add / update answer or content for a message - CHRÁNENÉ TOKENOM
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie upravovať odpovede' });
    }
    const { odpoved, obsah_prispevku } = req.body || {};
    const id = req.params.id;
    const id_psychologa = 1; // fixed assignment per requirement

    // Mark as unseen for the user only when a real (non-empty) answer is provided.
    // This prevents creating notifications when the psychologist saves without writing an answer.
    const shouldMarkUnseenByUser = typeof odpoved === 'string' && odpoved.trim().length > 0;

    // If a field is omitted from the request body, keep the DB value unchanged.
    const odpovedParam = typeof odpoved === 'undefined' ? null : encryptText(odpoved);
    const obsahPrispevkuParam = typeof obsah_prispevku === 'undefined' ? null : encryptText(obsah_prispevku);

    const update = await pool.query(
      `UPDATE Schranka_dovery
          SET odpoved = COALESCE($1, odpoved),
              obsah_prispevku = COALESCE($2, obsah_prispevku),
              id_psychologa = $4,
              videne_uzivatelom = CASE WHEN $5 THEN false ELSE videne_uzivatelom END
        WHERE id_prispevku = $3
        RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, zverejnene, videne_psychologom, videne_uzivatelom, odpoved, id_uzivatela, id_psychologa, datum_pridania`,
      [odpovedParam, obsahPrispevkuParam, id, id_psychologa, shouldMarkUnseenByUser]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
    }

    const updatedRow = decryptTrustRow(update.rows[0]);
    // Notify psycholog always; notify the owning user only when this change creates a new unseen reply.
    if (shouldMarkUnseenByUser && updatedRow?.id_uzivatela) {
      emitTrustBoxUpdate(req, { action: 'reply', id: Number(id) || null }, { userId: updatedRow.id_uzivatela });
    } else {
      emitTrustBoxUpdate(req, { action: 'updated', id: Number(id) || null });
    }
    return res.json(updatedRow);
  } catch (err) {
    console.error('Error updating trust box message:', err);
    return res.status(500).json({ error: 'Chyba servera pri ukladaní odpovede' });
  }
});

// Publish a trust box message (only if user allowed publishing) - CHRÁNENÉ TOKENOM
router.patch('/:id/publish', authenticateToken, async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie publikovať príspevky' });
    }
    const id = req.params.id;

    const update = await pool.query(
      `UPDATE Schranka_dovery
          SET zverejnene = true
        WHERE id_prispevku = $1 AND publikovatelne = true
        RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, zverejnene, videne_psychologom, videne_uzivatelom, odpoved, id_uzivatela, id_psychologa, datum_pridania`,
      [id]
    );

    if (update.rowCount === 0) {
      return res.status(400).json({ error: 'Príspevok nie je publikovateľný alebo neexistuje' });
    }

    emitTrustBoxUpdate(req, { action: 'published', id: Number(id) || null });
    return res.json(decryptTrustRow(update.rows[0]));
  } catch (err) {
    console.error('Error publishing trust box message:', err);
    return res.status(500).json({ error: 'Chyba servera pri publikovaní' });
  }
});

// Unpublish a trust box message (keep in DB) - CHRÁNENÉ TOKENOM
router.patch('/:id/unpublish', authenticateToken, async (req, res) => {
  try {
    if (!isPsycholog(req.user?.role)) {
      return res.status(403).json({ error: 'Nemáte oprávnenie zrušiť publikovanie' });
    }
    const id = req.params.id;

    const update = await pool.query(
      `UPDATE Schranka_dovery
          SET zverejnene = false
        WHERE id_prispevku = $1
        RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, zverejnene, videne_psychologom, videne_uzivatelom, odpoved, id_uzivatela, id_psychologa, datum_pridania`,
      [id]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
    }

    emitTrustBoxUpdate(req, { action: 'unpublished', id: Number(id) || null });
    return res.json(decryptTrustRow(update.rows[0]));
  } catch (err) {
    console.error('Error unpublishing trust box message:', err);
    return res.status(500).json({ error: 'Chyba servera pri zrušení publikovania' });
  }
});

// Get published trust box messages (public)
router.get('/published', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT sd.id_prispevku, sd.kategoria, sd.obsah_prispevku, sd.anonymne, sd.publikovatelne, sd.zverejnene,
              sd.odpoved, sd.datum_pridania,
              CONCAT(u.meno, ' ', u.priezvisko) AS uzivatel_meno
       FROM Schranka_dovery sd
       LEFT JOIN Uzivatel u ON u.id_uzivatela = sd.id_uzivatela
       WHERE sd.zverejnene = true AND sd.publikovatelne = true
       ORDER BY sd.datum_pridania DESC`
    );

    return res.json((result.rows || []).map(decryptTrustRow));
  } catch (err) {
    console.error('Error fetching published trust box messages:', err);
    return res.status(500).json({ error: 'Chyba servera pri načítaní publikovaných správ' });
  }
});

module.exports = router;
