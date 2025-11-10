// utils/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsFolder = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsFolder))
  fs.mkdirSync(uploadsFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = "member_" + Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit (adjust if needed)
  fileFilter: function (req, file, cb) {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only images are allowed"));
  },
});

module.exports = { upload, uploadsFolder };
