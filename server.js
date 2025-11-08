require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load test including answers (server-side)
const testFile = path.join(__dirname, 'test.json');
const rawTest = JSON.parse(fs.readFileSync(testFile, 'utf8'));

// Initialize DB and start
(async () => {
  await db.init();
})();

// Return test without answers
app.get('/api/test', (req, res) => {
  const sanitized = rawTest.map(q => ({
    id: q.id,
    question: q.question,
    choices: q.choices
  }));
  res.json({ title: 'Science Test', questions: sanitized });
});

// Submit results
app.post('/api/results', async (req, res) => {
  try {
    const { name, email, answers } = req.body || {};
    if (!name || !email || !answers) {
      return res.status(400).json({ error: 'name, email and answers are required' });
    }
    // Score
    let score = 0;
    const correctAnswers = {};
    rawTest.forEach(q => {
      correctAnswers[q.id] = q.answerIndex;
      if (answers[q.id] !== undefined && Number(answers[q.id]) === q.answerIndex) score++;
    });
    const total = rawTest.length;
    const saved = await db.saveResult({ name, email, score, total, answers });
    res.json({ score, total, correctAnswers, savedId: saved.id || saved.id });
  } catch (err) {
    console.error('Error saving result', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: get results (requires Authorization header Bearer <token>)
app.get('/api/results', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  try {
    const results = await db.getResults();
    res.json({ results });
  } catch (err) {
    console.error('Error fetching results', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});