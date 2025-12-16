const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3005;

app.use(cors()); 
// Middlewares
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Open / create DB
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) return console.error('DB open error', err);
  console.log('Connected to SQLite DB:', dbFile);
});

// Create table if not exists
const createTableSQL = `
CREATE TABLE IF NOT EXISTS userLogin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  password TEXT NOT NULL
)`;
db.run(createTableSQL);

// REST API
// 1. GET /api/userLogin  -> list all
app.get('/api/userLogin', (req, res) => {
  db.all('SELECT * FROM userLogin ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. GET /api/userLogin/:id -> single item
app.get('/api/userLogin/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM userLogin WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// 3. POST /api/userLogin -> create
app.post('/api/userLogin', (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });
  const sql = 'INSERT INTO userLogin (email, password) VALUES (?, ?)';
  db.run(sql, [email, password || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // this.lastID contains the new id
    db.get('SELECT * FROM userLogin WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

// 4. PUT /api/userLogin/:id -> update
app.put('/api/userLogin/:id', (req, res) => {
  const id = req.params.id;
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!password) return res.status(400).json({ error: 'password is required' });
  const sql = 'UPDATE userLogin SET email = ?, password = ? WHERE id = ?';
  db.run(sql, [email, password || null, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    db.get('SELECT * FROM userLogin WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// 5. DELETE /api/userLogin/:id -> delete
app.delete('/api/userLogin/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM userLogin WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
