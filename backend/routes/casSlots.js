const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// GET all slots (optional filters: psycholog_id, date)
router.get('/', async (req, res) => {
  try {
    const { psycholog_id, date } = req.query;
    const params = [];
    const where = [];

    if (psycholog_id) {
      params.push(psycholog_id);
      where.push(`id_psychologicky = $${params.length}`);
    }
    if (date) {
      params.push(date);
      where.push(`datum = $${params.length}`);
    }

    const sql = `
      SELECT 
        id_casu, 
        id_psychologicky, 
        TO_CHAR(datum, 'YYYY-MM-DD') as datum,
        cas_od, 
        cas_do, 
        volny 
      FROM Cas_slot 
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} 
      ORDER BY datum, cas_od
    `;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Cas_slot list error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// GET single slot
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id_casu, 
        id_psychologicky, 
        TO_CHAR(datum, 'YYYY-MM-DD') as datum,
        cas_od, 
        cas_do, 
        volny 
      FROM Cas_slot 
      WHERE id_casu = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot nebol nájdený' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cas_slot get error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// CREATE slot
router.post('/', async (req, res) => {
  try {
    const { id_psychologicky, datum, cas_od, cas_do, volny = true } = req.body;
    if (!id_psychologicky || !datum || !cas_od || !cas_do) {
      return res.status(400).json({ error: 'Chýbajú povinné polia: id_psychologicky, datum, cas_od, cas_do' });
    }

    const result = await pool.query(
      'INSERT INTO Cas_slot (id_psychologicky, datum, cas_od, cas_do, volny) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id_psychologicky, datum, cas_od, cas_do, volny]
    );
    res.status(201).json({ message: 'OK', slot: result.rows[0] });
  } catch (error) {
    console.error('Cas_slot create error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// UPDATE slot
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [];
    const values = [];

    ['id_psychologicky', 'datum', 'cas_od', 'cas_do', 'volny'].forEach((key) => {
      if (req.body[key] !== undefined) {
        values.push(req.body[key]);
        fields.push(`${key} = $${values.length}`);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nič na aktualizáciu' });
    }

    values.push(id);
    const sql = `UPDATE Cas_slot SET ${fields.join(', ')} WHERE id_casu = $${values.length} RETURNING *`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot nebol nájdený' });
    res.json({ message: 'Aktualizované', slot: result.rows[0] });
  } catch (error) {
    console.error('Cas_slot update error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// DELETE slot by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Cas_slot WHERE id_casu = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot nebol nájdený' });
    res.json({ message: 'Zmazané', slot: result.rows[0] });
  } catch (error) {
    console.error('Cas_slot delete error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// DELETE all slots (truncate)
router.delete('/', async (_req, res) => {
  try {
    const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM Cas_slot');
    await pool.query('TRUNCATE TABLE Cas_slot RESTART IDENTITY');
    res.json({ message: 'Všetky sloty zmazané', deleted: countRes.rows[0].cnt });
  } catch (error) {
    console.error('Cas_slot truncate error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

module.exports = router;
