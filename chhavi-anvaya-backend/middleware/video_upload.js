const multer = require("multer");

const videoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === "thumbnail") {
    if (!imageTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid thumbnail type. Only JPEG, PNG, and WebP are allowed."));
    }
    return cb(null, true);
  }

  if (!videoTypes.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only MP4, WebM, and MOV videos are allowed.")
    );
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = upload;
