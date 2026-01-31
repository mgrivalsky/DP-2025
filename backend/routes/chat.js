const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// Get all chats for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT c.*, 
              u.meno as uzivatel_meno, u.priezvisko as uzivatel_priezvisko, u.email as uzivatel_email,
              p.meno as psycholog_meno, p.priezvisko as psycholog_priezvisko, p.email as psycholog_email
       FROM Chat c
       JOIN Uzivatel u ON c.id_uzivatela = u.id_uzivatela
       JOIN Psychologicka p ON c.id_psychologicky = p.id_psychologicky
       WHERE c.id_uzivatela = $1
       ORDER BY c.posledna_zprava DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all chats for a psychologist
router.get('/psycholog/:psychologId', async (req, res) => {
  try {
    const { psychologId } = req.params;
    const result = await pool.query(
      `SELECT c.*, 
              u.meno as uzivatel_meno, u.priezvisko as uzivatel_priezvisko, u.email as uzivatel_email,
              p.meno as psycholog_meno, p.priezvisko as psycholog_priezvisko, p.email as psycholog_email,
              (
                SELECT COUNT(*)::int
                FROM Sprava s
                WHERE s.id_chatu = c.id_chatu
                  AND LOWER(TRIM(s.odesilatel_typ)) <> 'psycholog'
                  AND s.videne = false
              ) as unread_count
       FROM Chat c
       JOIN Uzivatel u ON c.id_uzivatela = u.id_uzivatela
       JOIN Psychologicka p ON c.id_psychologicky = p.id_psychologicky
       WHERE c.id_psychologicky = $1
       ORDER BY c.posledna_zprava DESC`,
      [psychologId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await pool.query(
      `SELECT * FROM Sprava 
       WHERE id_chatu = $1
       ORDER BY cas_odoslania ASC`,
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mark all psychologist messages as seen for a user
router.put('/user/:userId/mark-seen-psycholog', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ error: 'userId je povinne' });
    }

    await pool.query(
      `UPDATE Sprava s
       SET videne = true
       FROM Chat c
       WHERE s.id_chatu = c.id_chatu
         AND c.id_uzivatela = $1
         AND LOWER(TRIM(s.odesilatel_typ)) != 'uzivatel'
         AND s.videne = false`,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mark all user messages as seen for a chat (psychologist view)
router.put('/:chatId/mark-seen-user', async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    if (!chatId) {
      return res.status(400).json({ error: 'chatId je povinne' });
    }

    await pool.query(
      `UPDATE Sprava
       SET videne = true
       WHERE id_chatu = $1
         AND LOWER(TRIM(odesilatel_typ)) <> 'psycholog'
         AND videne = false`,
      [chatId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create or get existing chat
router.post('/create', async (req, res) => {
  try {
    const { userId, psychologId } = req.body;

    if (!userId || !psychologId) {
      return res.status(400).json({ error: 'userId a psychologId su povinne' });
    }

    // Check if chat already exists
    let chat = await pool.query(
      `SELECT * FROM Chat 
       WHERE id_uzivatela = $1 AND id_psychologicky = $2`,
      [userId, psychologId]
    );

    if (chat.rows.length > 0) {
      return res.json(chat.rows[0]);
    }

    // Create new chat
    const newChat = await pool.query(
      `INSERT INTO Chat (id_uzivatela, id_psychologicky) 
       VALUES ($1, $2)
       RETURNING *`,
      [userId, psychologId]
    );

    res.json(newChat.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/:chatId/message', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { obsah, odesilatel_typ } = req.body;

    if (!obsah || !odesilatel_typ) {
      return res.status(400).json({ error: 'obsah a odesilatel_typ su povinne' });
    }

    if (!['uzivatel', 'psycholog'].includes(odesilatel_typ)) {
      return res.status(400).json({ error: 'Neplatny typ odesilatela' });
    }

    // Insert message
    const message = await pool.query(
      `INSERT INTO Sprava (obsah, id_chatu, odesilatel_typ, videne) 
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [obsah, chatId, odesilatel_typ]
    );

    // Update chat's last message timestamp
    await pool.query(
      `UPDATE Chat SET posledna_zprava = CURRENT_TIMESTAMP WHERE id_chatu = $1`,
      [chatId]
    );

    res.json(message.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
