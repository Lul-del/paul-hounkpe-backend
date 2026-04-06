const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../uploads/badges")),
  filename: (req, file, cb) =>
    cb(null, "photo-" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function fileToDataUri(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".avif": "image/avif",
    };
    const mime = mimes[ext] || "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function safe(s, max = 999) {
  return (s || "")
    .substring(0, max)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.post(
  "/generate",
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    const { full_name, whatsapp, region, commune, intention, message } =
      req.body;
    if (!full_name)
      return res.status(400).json({ error: "Nom complet requis" });

    const photoPath = req.file ? `/uploads/badges/${req.file.filename}` : null;

    let userPhotoUri = null;
    if (req.file) {
      userPhotoUri = fileToDataUri(
        path.join(__dirname, "../uploads/badges", req.file.filename),
      );
    }

    const bdPaths = [
      path.join(__dirname, "../../frontend/public/images/bd.jpeg"),
      path.join(__dirname, "../../frontend/public/images/bd.jpg"),
      path.join(__dirname, "../../frontend/public/images/bd.png"),
    ];
    let presidentUri = null;
    for (const p of bdPaths) {
      presidentUri = fileToDataUri(p);
      if (presidentUri) break;
    }

    const safeName = safe(full_name, 30).toUpperCase();
    const initiales = (full_name || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const W = 520;
    const H = 700;

    const hasRegion = !!(region || commune);
    const hasWhatsapp = !!whatsapp;
    const hasMessage = !!message;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="clipUser">
      <rect x="38" y="118" width="176" height="210" rx="18" ry="18"/>
    </clipPath>
    <clipPath id="clipPres">
      <rect x="306" y="118" width="176" height="210" rx="18" ry="18"/>
    </clipPath>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a5c2a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0d3d18;stop-opacity:1"/>
    </linearGradient>
    <radialGradient id="decoGrad" cx="80%" cy="10%" r="40%">
      <stop offset="0%" style="stop-color:#2d7a3a;stop-opacity:0.5"/>
      <stop offset="100%" style="stop-color:#1a5c2a;stop-opacity:0"/>
    </radialGradient>
  </defs>

  <!-- FOND -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)" rx="24"/>
  <circle cx="460" cy="60" r="120" fill="url(#decoGrad)"/>
  <circle cx="460" cy="60" r="80" fill="none" stroke="#2d7a3a" stroke-width="1.5" opacity="0.4"/>
  <circle cx="60" cy="650" r="80" fill="#2d7a3a" opacity="0.12"/>

  <!-- TITRE -->
  <text x="${W / 2}" y="46" font-family="Archivo Black,Arial Black,sans-serif" font-size="15" fill="#f5c518" font-weight="900" letter-spacing="2" text-anchor="middle">BADGE DE SOUTIEN OFFICIEL</text>
  <text x="${W / 2}" y="68" font-family="DM Sans,Arial,sans-serif" font-size="10" fill="#f5c518" letter-spacing="1.5" opacity="0.9" text-anchor="middle">FCBE · FORCES CAURIS POUR UN BÉNIN ÉMERGENT</text>

  <!-- SEPARATEUR -->
  <rect x="24" y="85" width="${W - 48}" height="1.5" fill="#f5c518" opacity="0.35" rx="1"/>

  <!-- PHOTO UTILISATEUR -->
  <rect x="34" y="100" width="184" height="218" fill="#f5c518" rx="20"/>
  <rect x="38" y="104" width="176" height="210" fill="#0d3d18" rx="18"/>
  ${
    userPhotoUri
      ? `<image href="${userPhotoUri}" x="38" y="104" width="176" height="210" clip-path="url(#clipUser)" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="38" y="104" width="176" height="210" fill="#1a5c2a" rx="18"/>
       <text x="126" y="226" font-family="Archivo Black,Arial Black,sans-serif" font-size="52" fill="#f5c518" text-anchor="middle" font-weight="900" opacity="0.8">${initiales}</text>`
  }

  <!-- COEUR -->
  <circle cx="${W / 2}" cy="210" r="26" fill="#f5c518"/>
  <path d="M${W / 2} 224 C${W / 2} 224 ${W / 2 - 16} 212 ${W / 2 - 16} 203 C${W / 2 - 16} 197 ${W / 2 - 10} 193 ${W / 2} 199 C${W / 2 + 10} 193 ${W / 2 + 16} 197 ${W / 2 + 16} 203 C${W / 2 + 16} 212 ${W / 2} 224 ${W / 2} 224Z" fill="#1a5c2a"/>

  <!-- PHOTO PRESIDENT -->
  <rect x="302" y="100" width="184" height="218" fill="#f5c518" rx="20"/>
  <rect x="306" y="104" width="176" height="210" fill="#0d3d18" rx="18"/>
  ${
    presidentUri
      ? `<image href="${presidentUri}" x="306" y="104" width="176" height="210" clip-path="url(#clipPres)" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="306" y="104" width="176" height="210" fill="#1a5c2a" rx="18"/>
       <text x="394" y="226" font-family="Archivo Black,Arial Black,sans-serif" font-size="28" fill="#f5c518" text-anchor="middle" font-weight="900">PH</text>`
  }

  <!-- NOMS SOUS PHOTOS -->
  <text x="126" y="346" font-family="Archivo Black,Arial Black,sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="900" letter-spacing="0.5">${safeName}</text>
  <text x="394" y="346" font-family="Archivo Black,Arial Black,sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="900" letter-spacing="0.5">PAUL HOUNKPÈ</text>

  <!-- TEXTE SOUTIEN -->
  <text x="${W / 2}" y="388" font-family="DM Sans,Arial,sans-serif" font-size="16" fill="white" text-anchor="middle">
    Moi <tspan font-family="Archivo Black,Arial Black,sans-serif" font-weight="900" fill="#f5c518">${safe(full_name, 22)}</tspan> soutient le Candidat
  </text>

  <!-- BOUTON JAUNE -->
  <rect x="24" y="404" width="${W - 48}" height="64" fill="#f5c518" rx="12"/>
  <text x="${W / 2}" y="446" font-family="Archivo Black,Arial Black,sans-serif" font-size="27" fill="#1a5c2a" text-anchor="middle" font-weight="900" letter-spacing="1">PAUL HOUNKPÈ</text>

  <!-- POUR LA MARINA -->
  <text x="${W / 2}" y="502" font-family="DM Sans,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" font-style="italic" letter-spacing="1">pour la Marina 2026</text>

  <!-- SEPARATEUR BAS -->
  <rect x="80" y="520" width="${W - 160}" height="1" fill="white" opacity="0.2" rx="1"/>

  <!-- REGION -->
  ${
    hasRegion
      ? `
  <g transform="translate(${W / 2 - 130}, 534)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white" opacity="0.9"/>
    </svg>
  </g>
  <text x="${W / 2 + 4}" y="548" font-family="Archivo Black,Arial Black,sans-serif" font-size="17" fill="white" text-anchor="middle" font-weight="900" opacity="0.95">${safe(region)}${commune ? " — " + safe(commune) : ""}</text>
  `
      : ""
  }

  <!-- WHATSAPP -->
  ${
    hasWhatsapp
      ? `
  <g transform="translate(${W / 2 - 120}, ${hasRegion ? 562 : 534})">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white" opacity="0.9"/>
    </svg>
  </g>
  <text x="${W / 2 + 4}" y="${hasRegion ? 576 : 548}" font-family="Archivo Black,Arial Black,sans-serif" font-size="17" fill="white" text-anchor="middle" font-weight="900" opacity="0.95">${safe(whatsapp)}</text>
  `
      : ""
  }

  <!-- MESSAGE -->
  ${
    hasMessage
      ? `
  <g transform="translate(${W / 2 - 130}, ${hasRegion && hasWhatsapp ? 588 : hasRegion || hasWhatsapp ? 562 : 534})">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" fill="#f5c518" opacity="0.95"/>
    </svg>
  </g>
  <text x="${W / 2 + 4}" y="${hasRegion && hasWhatsapp ? 604 : hasRegion || hasWhatsapp ? 576 : 548}" font-family="Archivo Black,Arial Black,sans-serif" font-size="17" fill="#f5c518" text-anchor="middle" font-weight="900" font-style="italic" opacity="0.95">${safe(message, 52)}</text>
  `
      : ""
  }

  <!-- HASHTAGS -->
  <text x="${W / 2}" y="660" font-family="Archivo Black,Arial Black,sans-serif" font-size="13" fill="white" text-anchor="middle" font-weight="900" opacity="0.75" letter-spacing="1.5">#PAULHOUNKPÈ2026 · #MARINA2026</text>

  <!-- BORDURE EXTERNE -->
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="#f5c518" stroke-width="1.5" rx="23" opacity="0.3"/>
</svg>`;

    const filename = `badge-${Date.now()}.svg`;
    const badgeFilePath = path.join(__dirname, "../uploads/bd.jpeg"),
    fs.writeFileSync(badgeFilePath, svgContent, "utf8");
    const imagePath = `/uploads/badges/${filename}`;

    const [result] = await db.query(
      "INSERT INTO badges (full_name, whatsapp, region, commune, intention, photo, message, image_path) VALUES (?,?,?,?,?,?,?,?)",
      [
        full_name,
        whatsapp || null,
        region || null,
        commune || null,
        intention || null,
        photoPath,
        message || null,
        imagePath,
      ],
    );

    res.json({
      id: result.insertId,
      image_path: imagePath,
      download_url: `${process.env.BACKEND_URL || "https://paulhounkpebackend-wmrarpee.b4a.run"}${imagePath}`,
    });
  },
);

router.get("/", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM badges ORDER BY created_at DESC LIMIT 100",
  );
  res.json(rows);
});

module.exports = router;
