const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth");

router.get("/stats", authMiddleware, async (req, res) => {
  const [[{ total_contents }]] = await db.query(
    "SELECT COUNT(*) as total_contents FROM contents",
  );
  const [[{ total_views }]] = await db.query(
    "SELECT COALESCE(SUM(views), 0) as total_views FROM contents",
  );
  const [[{ total_likes }]] = await db.query(
    "SELECT COUNT(*) as total_likes FROM likes",
  );
  const [[{ total_comments }]] = await db.query(
    "SELECT COUNT(*) as total_comments FROM comments",
  );
  const [[{ total_badges }]] = await db.query(
    "SELECT COUNT(*) as total_badges FROM badges",
  );
  const [[{ total_ideas }]] = await db.query(
    "SELECT COUNT(*) as total_ideas FROM ideas",
  );
  const [[{ unread_ideas }]] = await db.query(
    "SELECT COUNT(*) as unread_ideas FROM ideas WHERE read_status = 0",
  );

  const [top_contents] = await db.query(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM likes l WHERE l.content_id = c.id) AS likes_count,
      (SELECT COUNT(*) FROM comments cm WHERE cm.content_id = c.id) AS comments_count
    FROM contents c ORDER BY c.views DESC LIMIT 10`);

  const [badges_by_region] = await db.query(`
    SELECT region, COUNT(*) as count FROM badges GROUP BY region ORDER BY count DESC`);

  const [intentions_stats] = await db.query(`
    SELECT intention, COUNT(*) as count FROM badges GROUP BY intention ORDER BY count DESC`);

  res.json({
    total_contents,
    total_views,
    total_likes,
    total_comments,
    total_badges,
    total_ideas,
    unread_ideas,
    top_contents,
    badges_by_region,
    intentions_stats,
  });
});

module.exports = router;
