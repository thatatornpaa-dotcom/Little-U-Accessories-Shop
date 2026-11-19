import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a file buffer to Cloudflare R2 bucket and returns its public URL.
 * @param {Buffer | ArrayBuffer | Uint8Array} fileBuffer 
 * @param {string} fileName 
 * @param {string} contentType 
 * @returns {Promise<string>}
 */
export const uploadToR2 = async (fileBuffer, fileName, contentType) => {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("CLOUDFLARE_R2_BUCKET_NAME is not set");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3.send(command);

  // Public base URL
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${bucketName}.r2.dev`;
  return `${publicUrl}/${fileName}`;
};

/**
 * Deletes a file from Cloudflare R2 bucket.
 * @param {string} urlOrKey 
 * @returns {Promise<string>}
 */
export const deleteFromR2 = async (urlOrKey) => {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("CLOUDFLARE_R2_BUCKET_NAME is not set");
  }

  let key = urlOrKey;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${bucketName}.r2.dev`;
  
  if (urlOrKey.startsWith(publicUrl)) {
    key = urlOrKey.replace(`${publicUrl}/`, "");
  } else if (urlOrKey.startsWith("http")) {
    try {
      const urlObj = new URL(urlOrKey);
      key = urlObj.pathname.substring(1); // strip leading slash
    } catch (e) {
      // fallback if not a valid URL
    }
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3.send(command);
  return key;
};

