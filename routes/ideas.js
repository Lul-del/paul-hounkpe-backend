const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message requis' });
  const [result] = await db.query('INSERT INTO ideas (name, email, message) VALUES (?, ?, ?)', [name || 'Anonyme', email || null, message]);
  res.json({ id: result.insertId, message: 'Idée envoyée avec succès !' });
});

router.get('/', authMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM ideas ORDER BY created_at DESC');
  res.json(rows);
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  await db.query('UPDATE ideas SET read_status = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Marqué comme lu' });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await db.query('DELETE FROM ideas WHERE id = ?', [req.params.id]);
  res.json({ message: 'Idée supprimée' });
});

module.exports = router;
