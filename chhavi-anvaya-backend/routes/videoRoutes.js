const express = require("express");
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
} = require("../controllers/videoController");

const router = express.Router();

router.get("/catalog", getCatalog);
router.get("/", authenticateToken, listVideos);
router.get("/mine", authenticateToken, authorizeRole(ROLES.CREATOR), getMyVideos);
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
router.get("/:id", authenticateToken, getVideo);
router.post("/:id/comments", authenticateToken, addComment);
router.put("/:id/rating", authenticateToken, rateVideo);

module.exports = router;
