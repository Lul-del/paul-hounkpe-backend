const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/:contentId', async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const { contentId } = req.params;
  const [existing] = await db.query('SELECT id FROM likes WHERE content_id = ? AND ip_address = ?', [contentId, ip]);
  if (existing.length) {
    await db.query('DELETE FROM likes WHERE content_id = ? AND ip_address = ?', [contentId, ip]);
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM likes WHERE content_id = ?', [contentId]);
    return res.json({ liked: false, count });
  }
  await db.query('INSERT INTO likes (content_id, ip_address) VALUES (?, ?)', [contentId, ip]);
  const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM likes WHERE content_id = ?', [contentId]);
  res.json({ liked: true, count });
});

router.get('/:contentId/check', async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const [existing] = await db.query('SELECT id FROM likes WHERE content_id = ? AND ip_address = ?', [req.params.contentId, ip]);
  res.json({ liked: existing.length > 0 });
});

module.exports = router;
