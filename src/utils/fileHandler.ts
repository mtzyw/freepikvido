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
  // 验证文件大小 (10MB限制)
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new Error('文件大小超过限制(10MB)');
  }

  // 验证并清理文件名
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const fileExtension = sanitizedName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // 限制允许的文件扩展名
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`不支持的文件格式，只允许: ${allowedExtensions.join(', ')}`);
  }

  // 使用Sharp验证和处理图片
  let processedBuffer: Buffer;
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // 验证图片尺寸
    if (!metadata.width || !metadata.height) {
      throw new Error('无法读取图片尺寸信息');
    }
    
    if (metadata.width > 8192 || metadata.height > 8192) {
      throw new Error('图片尺寸过大，最大支持8192x8192像素');
    }

    processedBuffer = await image
      .resize(2048, 2048, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (error) {
    throw new Error('图片格式无效或已损坏');
  }

  const fileName = `${uuidv4()}.jpg`; // 统一转换为jpg
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
    // 安全地生成唯一的文件路径
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
    const fileExtension = sanitizedName.split('.').pop()?.toLowerCase() || 'mp4';
    
    // 验证文件扩展名
    const allowedExtensions = ['mp4', 'mov', 'avi', 'mkv'];
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`不支持的视频格式，只允许: ${allowedExtensions.join(', ')}`);
    }
    
    const fileName = `${Date.now()}_${uuidv4()}.mp4`; // 统一使用mp4格式
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