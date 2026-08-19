const path = require("path");
const { Op, fn, col } = require("sequelize");
const { User, Video, Comment, Rating } = require("../models");
const upload = require("../middleware/video_upload");
const { GENRES, AGE_RATINGS } = require("../constants/catalog");
const { cacheGet, cacheSet, cacheDelPrefix } = require("../config/cache");
const { persistLocalFile, publicUrlFor, storedRef } = require("../config/storage");
const { moderateMetadata, transcodeIfPossible } = require("../config/media");

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

const videoIncludes = [
  {
    model: User,
    as: "creator",
    attributes: ["id", "username", "name", "role", "profile_url"],
  },
];

const withPlaybackUrls = async (video) => {
  const json = video.toJSON ? video.toJSON() : video;
  json.playback_url = await publicUrlFor(json.video_url);
  json.thumbnail_playback_url = json.thumbnail_url
    ? await publicUrlFor(json.thumbnail_url)
    : null;
  if (json.ratings) {
    const scores = json.ratings.map((r) => r.score);
    json.average_rating = scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;
    json.rating_count = scores.length;
  }
  return json;
};

const listVideos = async (req, res) => {
  const { limit, offset, page } = getPagination(req.query);
  const { q, genre, age_rating } = req.query;
  const cacheKey = `videos:list:${page}:${limit}:${q || ""}:${genre || ""}:${age_rating || ""}`;

  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const where = { moderation_status: "approved" };
    if (genre) where.genre = genre;
    if (age_rating) where.age_rating = age_rating;
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { publisher: { [Op.iLike]: `%${q}%` } },
        { producer: { [Op.iLike]: `%${q}%` } },
        { genre: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { count, rows } = await Video.findAndCountAll({
      where,
      include: [
        ...videoIncludes,
        { model: Rating, as: "ratings", attributes: ["score", "user_id"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const videos = await Promise.all(rows.map(withPlaybackUrls));
    const payload = {
      success: true,
      videos,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };

    await cacheSet(cacheKey, payload, 30);
    res.set("X-Cache", "MISS");
    res.set("Cache-Control", "public, max-age=30");
    return res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
};

const getCatalog = (_req, res) => {
  return res.status(200).json({ success: true, genres: GENRES, age_ratings: AGE_RATINGS });
};

const getVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [
        ...videoIncludes,
        {
          model: Comment,
          as: "comments",
          attributes: ["id", "comment", "createdAt", "user_id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "name"],
            },
          ],
        },
        {
          model: Rating,
          as: "ratings",
          attributes: ["score", "user_id"],
        },
      ],
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    await video.increment("view_count");
    const payload = await withPlaybackUrls(video);
    const userRating = req.user
      ? video.ratings.find((r) => r.user_id === req.user.id)
      : null;
    payload.user_rating = userRating ? userRating.score : null;

    return res.status(200).json({ success: true, video: payload });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch video." });
  }
};

const getMyVideos = async (req, res) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { count, rows } = await Video.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        ...videoIncludes,
        { model: Rating, as: "ratings", attributes: ["score", "user_id"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    const videos = await Promise.all(rows.map(withPlaybackUrls));
    return res.status(200).json({
      success: true,
      videos,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch your videos." });
  }
};

const createVideo = (req, res) => {
  upload.single("video")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { title, publisher, producer, genre, age_rating, description } = req.body;
    if (!title || !publisher || !producer || !genre || !age_rating || !req.file) {
      return res.status(400).json({
        message:
          "Title, publisher, producer, genre, age rating, and a video file are required.",
      });
    }

    if (!GENRES.includes(genre) || !AGE_RATINGS.includes(age_rating)) {
      return res.status(400).json({ message: "Invalid genre or age rating." });
    }

    const moderation = moderateMetadata({
      title,
      publisher,
      producer,
      description,
    });
    if (moderation.status === "flagged") {
      return res.status(400).json({
        message: "Video metadata failed content checks.",
        reason: moderation.reason,
      });
    }

    try {
      const originalPath = req.file.path;
      const media = transcodeIfPossible(originalPath);
      const playbackName = path.basename(media.outputPath);
      const stored = await persistLocalFile(media.outputPath, playbackName);

      let thumbnailRef = null;
      if (media.thumbnailPath) {
        const thumbName = path.basename(media.thumbnailPath);
        const thumbStored = await persistLocalFile(media.thumbnailPath, thumbName);
        thumbnailRef = storedRef(thumbStored);
      }

      const video = await Video.create({
        user_id: req.user.id,
        title,
        publisher,
        producer,
        genre,
        age_rating,
        description: description || null,
        video_url: storedRef(stored),
        original_url: path.basename(originalPath),
        thumbnail_url: thumbnailRef,
        duration_seconds: media.durationSeconds,
        transcode_status: media.status,
        moderation_status: "approved",
      });

      await cacheDelPrefix("videos:list:");
      const payload = await withPlaybackUrls(video);
      return res.status(201).json({
        success: true,
        message: "Video uploaded successfully",
        video: payload,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error uploading video" });
    }
  });
};

const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const video_id = req.params.id;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required." });
    }

    const video = await Video.findByPk(video_id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const newComment = await Comment.create({
      comment: comment.trim(),
      video_id,
      user_id: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Failed to add comment" });
  }
};

const rateVideo = async (req, res) => {
  try {
    const video_id = req.params.id;
    const score = parseInt(req.body.score, 10);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: "Score must be an integer from 1 to 5." });
    }

    const video = await Video.findByPk(video_id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    let rating = await Rating.findOne({
      where: { user_id: req.user.id, video_id },
    });
    if (rating) {
      rating.score = score;
      await rating.save();
    } else {
      rating = await Rating.create({
        user_id: req.user.id,
        video_id,
        score,
      });
    }

    const avgRow = await Rating.findAll({
      where: { video_id },
      attributes: [[fn("AVG", col("score")), "average"], [fn("COUNT", col("id")), "count"]],
      raw: true,
    });

    await cacheDelPrefix("videos:list:");
    return res.status(200).json({
      success: true,
      rating,
      average_rating: Number(Number(avgRow[0].average).toFixed(2)),
      rating_count: Number(avgRow[0].count),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to rate video" });
  }
};

module.exports = {
  listVideos,
  getCatalog,
  getVideo,
  getMyVideos,
  createVideo,
  addComment,
  rateVideo,
};
