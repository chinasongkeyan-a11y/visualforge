// ============================================================
// S3 Object Storage - uploads MP4 to S3 and returns signed URL
// ============================================================

import { S3Storage } from 'coze-coding-dev-sdk';
import fs from 'fs';

let storageInstance: S3Storage | null = null;

function getStorage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }
  return storageInstance;
}

/**
 * Upload an MP4 file to S3 and return a signed URL.
 * @param filePath - Local file path of the MP4
 * @param fileName - Desired file name (SDK will add UUID prefix)
 * @returns Signed URL for accessing the video
 */
export async function uploadVideo(filePath: string, fileName: string): Promise<string> {
  const storage = getStorage();
  const fileContent = fs.readFileSync(filePath);

  const fileKey = await storage.uploadFile({
    fileContent,
    fileName,
    contentType: 'video/mp4',
  });

  // Generate a signed URL valid for 7 days
  const signedUrl = await storage.generatePresignedUrl({
    key: fileKey,
    expireTime: 604800, // 7 days
  });

  return signedUrl;
}
