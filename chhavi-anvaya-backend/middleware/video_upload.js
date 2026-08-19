const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "videos", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase() || ".mp4";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only MP4, WebM, and MOV videos are allowed.")
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = upload;
