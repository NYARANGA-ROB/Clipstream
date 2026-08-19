const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

const localRoot = path.join(__dirname, "..", "videos", "uploads");
fs.mkdirSync(localRoot, { recursive: true });

const isS3Enabled = () =>
  Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY &&
      process.env.S3_SECRET_KEY &&
      process.env.S3_BUCKET
  );

let s3Client;
const getS3 = () => {
  if (!isS3Enabled()) return null;
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  });
  return s3Client;
};

const objectKey = (filename) => `videos/${filename}`;

const persistLocalFile = async (localPath, filename) => {
  const s3 = getS3();
  if (!s3) {
    return { kind: "local", key: filename };
  }

  try {
    const body = fs.createReadStream(localPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: objectKey(filename),
        Body: body,
        ContentType: filename.endsWith(".jpg") ? "image/jpeg" : "video/mp4",
      })
    );
    return { kind: "s3", key: objectKey(filename) };
  } catch (error) {
    console.error("Object storage upload failed, using local disk:", error.message);
    return { kind: "local", key: filename };
  }
};

const publicUrlFor = async (stored) => {
  if (!stored) return null;
  if (stored.startsWith("http")) return stored;
  if (stored.startsWith("s3:")) {
    const key = stored.slice(3);
    const s3 = getS3();
    if (!s3) return null;
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }),
      { expiresIn: 3600 }
    );
  }
  return `/media/${path.basename(stored)}`;
};

const storedRef = (result) => {
  if (result.kind === "s3") return `s3:${result.key}`;
  return result.key;
};

const localPathFor = (filename) => path.join(localRoot, filename);

module.exports = {
  isS3Enabled,
  persistLocalFile,
  publicUrlFor,
  storedRef,
  localPathFor,
  localRoot,
};
