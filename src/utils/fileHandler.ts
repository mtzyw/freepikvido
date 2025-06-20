import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import axios from 'axios';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.cloudflareR2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.cloudflareR2.accessKeyId,
    secretAccessKey: config.cloudflareR2.secretAccessKey,
  },
});

export interface UploadResult {
  url: string;
  key: string;
}

export const uploadImageToR2 = async (
  buffer: Buffer,
  originalName: string,
  userId: number
): Promise<UploadResult> => {
  const processedBuffer = await sharp(buffer)
    .resize(2048, 2048, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  const fileExtension = originalName.split('.').pop() || 'jpg';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const key = `uploads/images/${userId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: config.cloudflareR2.bucketName,
    Key: key,
    Body: processedBuffer,
    ContentType: 'image/jpeg',
  });

  await s3Client.send(command);

  const url = `${config.cloudflareR2.publicUrl}/${key}`;
  
  return { url, key };
};

export const uploadVideoToR2 = async (
  videoBuffer: Buffer,
  taskId: string
): Promise<UploadResult> => {
  const fileName = `${taskId}.mp4`;
  const key = `videos/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: config.cloudflareR2.bucketName,
    Key: key,
    Body: videoBuffer,
    ContentType: 'video/mp4',
  });

  await s3Client.send(command);

  const url = `${config.cloudflareR2.publicUrl}/${key}`;
  
  return { url, key };
};

export const downloadVideoFromURL = async (videoUrl: string): Promise<Buffer> => {
  const response = await axios({
    method: 'GET',
    url: videoUrl,
    responseType: 'arraybuffer',
    timeout: 60000, // 60 seconds timeout
  });

  return Buffer.from(response.data);
};