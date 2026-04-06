const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video');
    cb(null, path.join(__dirname, '..', isVideo ? 'uploads/videos' : 'uploads/images'));
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// GET all contents — comptage vues réel
router.get('/', async (req, res) => {
  const { type } = req.query;
  let query = `SELECT c.*,
    (SELECT COUNT(*) FROM likes l WHERE l.content_id = c.id) AS likes_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.content_id = c.id) AS comments_count
    FROM contents c`;
  const params = [];
  if (type) { query += ' WHERE c.type = ?'; params.push(type); }
  query += ' ORDER BY c.created_at DESC';
  const [rows] = await db.query(query, params);
  res.json(rows);
});

// GET single content + increment views
router.get('/:id', async (req, res) => {
  await db.query('UPDATE contents SET views = views + 1 WHERE id = ?', [req.params.id]);
  const [rows] = await db.query(
    `SELECT c.*,
    (SELECT COUNT(*) FROM likes l WHERE l.content_id = c.id) AS likes_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.content_id = c.id) AS comments_count
    FROM contents c WHERE c.id = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Contenu introuvable' });
  res.json(rows[0]);
});

// POST content (admin)
router.post('/', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  const { title, description } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Fichier requis' });
  const type = file.mimetype.startsWith('video') ? 'video' : 'image';
  const filePath = `/uploads/${type === 'video' ? 'videos' : 'images'}/${file.filename}`;
  const [result] = await db.query(
    'INSERT INTO contents (title, description, file_path, type) VALUES (?, ?, ?, ?)',
    [title, description, filePath, type]
  );
  res.json({ id: result.insertId, message: 'Contenu ajouté' });
});

// DELETE content (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  await db.query('DELETE FROM contents WHERE id = ?', [req.params.id]);
  res.json({ message: 'Contenu supprimé' });
});

module.exports = router;
