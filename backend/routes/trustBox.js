const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// Submit a trust box message
router.post('/', async (req, res) => {
  try {
    const { kategoria, obsah_prispevku, anonymne = false, publikovatelne = false, id_uzivatela } = req.body || {};

    // Fixne priradený psychológ (id_psychologicky = 1) podľa požiadavky
    const id_psychologicky = 1;

    if (!kategoria || !obsah_prispevku) {
      return res.status(400).json({ error: 'Kategória a obsah sú povinné' });
    }
    if (!id_uzivatela) {
      return res.status(401).json({ error: 'Prihlásenie je povinné pre odoslanie správy' });
    }

    const insert = await pool.query(
      `INSERT INTO Schranka_dovery (kategoria, obsah_prispevku, anonymne, publikovatelne, id_uzivatela, id_psychologicky)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, stav, id_uzivatela, id_psychologicky` ,
      [kategoria, obsah_prispevku, anonymne, publikovatelne, id_uzivatela, id_psychologicky]
    );

    return res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error('Error inserting trust box message:', err);
    return res.status(500).json({ error: 'Chyba servera pri ukladaní správy' });
  }
});

// Get all trust box messages (for admin/psychologist)
router.get('/', async (_req, res) => {
  try {
        const result = await pool.query(
       `SELECT sd.id_prispevku, sd.kategoria, sd.obsah_prispevku, sd.anonymne, sd.publikovatelne, sd.odpoved, sd.stav,
            sd.id_uzivatela, sd.id_psychologicky,
            CONCAT(u.meno, ' ', u.priezvisko) AS uzivatel_meno
          FROM Schranka_dovery sd
          LEFT JOIN Uzivatel u ON u.id_uzivatela = sd.id_uzivatela
          ORDER BY sd.id_prispevku DESC`
        );
    return res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching trust box messages:', err);
    return res.status(500).json({ error: 'Chyba servera pri načítaní správ' });
  }
});

// Add / update answer or content for a message
router.patch('/:id', async (req, res) => {
  try {
    const { odpoved, obsah_prispevku } = req.body || {};
    const id = req.params.id;
    const id_psychologicky = 1; // fixed assignment per requirement

    const update = await pool.query(
      `UPDATE Schranka_dovery
          SET odpoved = COALESCE($1, odpoved),
              obsah_prispevku = COALESCE($2, obsah_prispevku),
              stav = 'vyriesene',
              id_psychologicky = $4
        WHERE id_prispevku = $3
        RETURNING id_prispevku, kategoria, obsah_prispevku, anonymne, publikovatelne, odpoved, stav, id_uzivatela, id_psychologicky`,
      [odpoved ?? '', obsah_prispevku ?? null, id, id_psychologicky]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
    }

    return res.json(update.rows[0]);
  } catch (err) {
    console.error('Error updating trust box message:', err);
    return res.status(500).json({ error: 'Chyba servera pri ukladaní odpovede' });
  }
});

module.exports = router;
