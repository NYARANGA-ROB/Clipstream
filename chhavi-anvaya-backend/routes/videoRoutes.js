const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const upload = require("../middleware/video_upload");
const { ROLES } = require("../constants/catalog");
const {
  listVideos,
  getCatalog,
  getVideo,
  getMyVideos,
  createVideo,
  addComment,
  rateVideo,
  deleteVideo,
} = require("../controllers/videoController");

// PUBLIC: anyone can fetch the catalog, feed, and play a clip
router.get("/catalog", getCatalog);
router.get("/", listVideos);
router.get("/mine", authenticateToken, authorizeRole(ROLES.CREATOR), getMyVideos);
router.get("/:id", getVideo);

// PROTECTED: valid JWT + creator role required to upload or delete
router.post(
  "/",
  authenticateToken,
  authorizeRole(ROLES.CREATOR),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createVideo
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(ROLES.CREATOR),
  deleteVideo
);

router.post("/:id/comments", authenticateToken, addComment);
router.put("/:id/rating", authenticateToken, rateVideo);

module.exports = router;
