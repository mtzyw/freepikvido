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

/**
 * 上传视频文件到 Cloudflare R2 (用于完整视频处理流程)
 */
export async function uploadVideoFileToR2(
  fileBuffer: Buffer,
  originalName: string,
  userId: number
): Promise<UploadResult> {
  try {
    // 生成唯一的文件路径
    const fileExtension = originalName.split('.').pop() || 'mp4';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const key = `videos/${userId}/${fileName}`;

    console.log(`开始上传视频到R2: ${key}`);

    // 创建上传命令
    const command = new PutObjectCommand({
      Bucket: config.cloudflareR2.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: 'video/mp4',
    });

    // 执行上传
    await s3Client.send(command);

    // 构造公共访问URL
    const url = `${config.cloudflareR2.publicUrl}/${key}`;

    console.log(`视频上传R2成功: ${url}`);

    return {
      url,
      key,
    };
  } catch (error) {
    console.error('上传视频到R2失败:', error);
    throw new Error('视频上传失败');
  }
}