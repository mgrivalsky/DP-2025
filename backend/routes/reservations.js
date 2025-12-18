const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// Jednoduché API bez tokenov: pridať, vypísať všetky, zmazať všetky

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

// 1) Vytvorenie rezervácie (bez tokenu)
router.post('/', async (req, res) => {
  try {
    const { datum, cas_od, cas_do, poznamka, id_psychologicky, id_uzivatela, email, stav } = req.body;

    if (!datum || !cas_od) {
      return res.status(400).json({ error: 'Chýba povinné pole: datum alebo cas_od' });
    }

    const userId = await resolveUserId({ id_uzivatela, email });
    if (!userId) return res.status(400).json({ error: 'Nedá sa určiť užívateľ (zadajte id_uzivatela alebo email)' });

    const result = await pool.query(
      'INSERT INTO Rezervacia_sedeni (datum, cas_od, cas_do, poznamka, id_psychologicky, id_uzivatela, stav) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [datum, cas_od, cas_do || cas_od, poznamka || null, id_psychologicky || 1, userId, stav || 'pending']
    );

    res.status(201).json({ message: 'OK', reservation: result.rows[0] });
  } catch (error) {
    // Zachyť porušenie unikátneho indexu na (datum, cas_od, id_psychologicky)
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Tento termín je už obsadený' });
    }
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 2) Vypísať všetky rezervácie
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id_sedenia, r.datum, r.cas_od, r.cas_do, r.stav, r.poznamka,
             r.id_psychologicky, p.meno as psycholog_meno, p.priezvisko as psycholog_priezvisko,
             r.id_uzivatela, u.meno as uzivatel_meno, u.priezvisko as uzivatel_priezvisko, u.email as uzivatel_email
      FROM Rezervacia_sedeni r
      LEFT JOIN Uzivatel u ON u.id_uzivatela = r.id_uzivatela
      LEFT JOIN Psychologicka p ON p.id_psychologicky = r.id_psychologicky
      ORDER BY r.datum DESC, r.cas_od DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('List reservations error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// 3) Zmazať všetky rezervácie
router.delete('/', async (req, res) => {
  try {
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
      params.push(poznamka);
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
    const sql = `UPDATE Rezervacia_sedeni SET ${updates.join(', ')} WHERE id_sedenia = $${paramCount} RETURNING *`;
    const result = await pool.query(sql, params);
    res.json({ message: 'OK', reservation: result.rows[0] });
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
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Rezervacia_sedeni WHERE id_sedenia = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rezervácia nenájdená' });
    }
    res.json({ message: 'Rezervácia vymazaná', deleted: result.rows[0] });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

module.exports = router;
