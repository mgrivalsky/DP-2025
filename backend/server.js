const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');
const casSlotRoutes = require('./routes/casSlots');
const trustBoxRoutes = require('./routes/trustBox');
const pool = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/cas-slots', casSlotRoutes);
app.use('/api/trust-box', trustBoxRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-psycholog API is running' });
});

// DB health & diagnostics
app.get('/api/health/db', async (req, res) => {
  try {
    const version = await pool.query('select version()');
    const counts = await pool.query(
      `select (select count(*) from pg_catalog.pg_tables where schemaname = current_schema()) as tables_count`
    );
    res.json({
      db: 'ok',
      version: version.rows?.[0]?.version,
      tablesInSchema: Number(counts.rows?.[0]?.tables_count || 0)
    });
  } catch (e) {
    res.status(500).json({ db: 'error', code: e.code, message: e.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Niečo sa pokazilo!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API documentation: http://localhost:${PORT}/api/health`);
});
