const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BLOCKED = [
  "bomb",
  "terror",
  "suicide",
  "hate",
  "nazi",
  "exploit",
];

const hasFfmpeg = () => {
  const result = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return result.status === 0;
};

const moderateMetadata = ({ title, publisher, producer, description }) => {
  const haystack = [title, publisher, producer, description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const flagged = BLOCKED.find((word) => haystack.includes(word));
  if (flagged) {
    return { status: "flagged", reason: `Blocked term: ${flagged}` };
  }
  return { status: "approved", reason: null };
};

const transcodeIfPossible = (inputPath) => {
  if (!hasFfmpeg()) {
    return {
      outputPath: inputPath,
      thumbnailPath: null,
      durationSeconds: null,
      status: "skipped",
    };
  }

  const parsed = path.parse(inputPath);
  const outputPath = path.join(parsed.dir, `${parsed.name}-h264.mp4`);
  const thumbnailPath = path.join(parsed.dir, `${parsed.name}-thumb.jpg`);

  const transcode = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { encoding: "utf8" }
  );

  if (transcode.status !== 0 || !fs.existsSync(outputPath)) {
    return {
      outputPath: inputPath,
      thumbnailPath: null,
      durationSeconds: null,
      status: "failed",
    };
  }

  spawnSync(
    "ffmpeg",
    ["-y", "-ss", "00:00:01", "-i", outputPath, "-vframes", "1", thumbnailPath],
    { encoding: "utf8" }
  );

  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", outputPath],
    { encoding: "utf8" }
  );
  const durationSeconds = probe.status === 0 ? Math.round(Number(probe.stdout)) : null;

  return {
    outputPath,
    thumbnailPath: fs.existsSync(thumbnailPath) ? thumbnailPath : null,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    status: "ready",
  };
};

module.exports = { moderateMetadata, transcodeIfPossible, hasFfmpeg };
