const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  console.warn(
    "AZURE_STORAGE_CONNECTION_STRING is not set in environment variables."
  );
}

let blobServiceClient = null;
const getBlobServiceClient = () => {
  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set.");
  }
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  return blobServiceClient;
};

/**
 * Uploads a buffer or file stream to an Azure Blob Storage container.
 * @param {string} containerName - 'videos', 'thumbnails', or 'avatars'
 * @param {string} blobName - The unique filename in storage
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - Content type (e.g., 'video/mp4', 'image/png')
 * @returns {Promise<string>} The public URL of the uploaded blob
 */
const uploadBlob = async (containerName, blobName, buffer, mimeType) => {
  const containerClient = getBlobServiceClient().getContainerClient(containerName);
  await containerClient.createIfNotExists({ access: "blob" });

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  return blockBlobClient.url;
};

/**
 * Deletes a blob from a container.
 * @param {string} containerName
 * @param {string} blobName
 */
const deleteBlob = async (containerName, blobName) => {
  const containerClient = getBlobServiceClient().getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

module.exports = {
  uploadBlob,
  deleteBlob,
};
