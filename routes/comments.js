const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/:contentId', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM comments WHERE content_id = ? ORDER BY created_at DESC',
    [req.params.contentId]
  );
  res.json(rows);
});

router.post('/:contentId', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Nom et message requis' });
  const [result] = await db.query(
    'INSERT INTO comments (content_id, name, message) VALUES (?, ?, ?)',
    [req.params.contentId, name, message]
  );
  res.json({ id: result.insertId, name, message, created_at: new Date() });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
  res.json({ message: 'Commentaire supprimé' });
});

router.get('/', authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT cm.*, c.title as content_title FROM comments cm
     LEFT JOIN contents c ON cm.content_id = c.id ORDER BY cm.created_at DESC`
  );
  res.json(rows);
});

module.exports = router;
