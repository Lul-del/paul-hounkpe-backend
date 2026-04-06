require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();

// Middlewares
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000", /\.vercel\.app$/],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contents", require("./routes/contents"));
app.use("/api/likes", require("./routes/likes"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/badges", require("./routes/badges"));
app.use("/api/ideas", require("./routes/ideas"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", (req, res) =>
  res.json({ status: "OK", message: "API Campagne 2026 opérationnelle" }),
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur le port ${PORT}`));
