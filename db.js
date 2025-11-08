const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || '';

if (DATABASE_URL) {
  // Use Postgres
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        score INTEGER,
        total INTEGER,
        answers JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async function saveResult(r) {
    const q = `INSERT INTO results (name, email, score, total, answers) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const vals = [r.name, r.email, r.score, r.total, r.answers];
    const res = await pool.query(q, vals);
    return res.rows[0];
  }

  async function getResults() {
    const res = await pool.query(`SELECT * FROM results ORDER BY created_at DESC`);
    return res.rows;
  }

  module.exports = { init, saveResult, getResults };

} else {
  // Use SQLite
  const sqlite3 = require('sqlite3').verbose();
  const dbDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  const dbPath = path.join(dbDir, 'results.db');
  const db = new sqlite3.Database(dbPath);

  function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async function init() {
    await runAsync(`
      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        score INTEGER,
        total INTEGER,
        answers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async function saveResult(r) {
    const res = await runAsync(
      `INSERT INTO results (name,email,score,total,answers) VALUES (?,?,?,?,?)`,
      [r.name, r.email, r.score, r.total, JSON.stringify(r.answers)]
    );
    const row = await allAsync(`SELECT * FROM results WHERE id = ?`, [res.lastID]);
    return row[0];
  }

  async function getResults() {
    const rows = await allAsync(`SELECT * FROM results ORDER BY created_at DESC`);
    return rows.map(r => {
      try { r.answers = JSON.parse(r.answers); } catch (e) {}
      return r;
    });
  }

  module.exports = { init, saveResult, getResults };
}