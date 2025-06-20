import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadVideoFileToR2 } from './fileHandler';

/**
 * 从URL下载视频到临时文件
 */
export async function downloadVideoToTemp(videoUrl: string, taskId: string): Promise<string> {
  try {
    console.log(`开始下载视频: ${videoUrl}`);
    
    // 创建临时文件路径
    const tempDir = '/tmp';
    const fileName = `video_${taskId}_${uuidv4()}.mp4`;
    const tempFilePath = path.join(tempDir, fileName);
    
    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 下载视频文件
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      timeout: 60000, // 60秒超时
      headers: {
        'User-Agent': 'VideoBackend/1.0',
      },
    });
    
    // 创建写入流
    const writer = fs.createWriteStream(tempFilePath);
    
    // 将响应流写入文件
    response.data.pipe(writer);
    
    // 等待下载完成
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
      response.data.on('error', reject);
    });
    
    // 验证文件是否存在且有内容
    const stats = fs.statSync(tempFilePath);
    if (stats.size === 0) {
      throw new Error('下载的视频文件为空');
    }
    
    console.log(`视频下载完成: ${tempFilePath}, 大小: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    return tempFilePath;
    
  } catch (error) {
    console.error('视频下载失败:', error);
    throw new Error(`视频下载失败: ${(error as Error).message}`);
  }
}

/**
 * 将临时视频文件上传到R2并返回永久URL
 */
export async function uploadTempVideoToR2(tempFilePath: string, userId: number): Promise<string> {
  try {
    console.log(`开始上传视频到R2: ${tempFilePath}`);
    
    // 读取文件内容
    const fileBuffer = fs.readFileSync(tempFilePath);
    const fileName = `video_${Date.now()}_${path.basename(tempFilePath)}`;
    
    // 上传到R2
    const result = await uploadVideoFileToR2(fileBuffer, fileName, userId);
    
    console.log(`视频上传R2完成: ${result.url}`);
    return result.url;
    
  } catch (error) {
    console.error('视频上传R2失败:', error);
    throw new Error(`视频上传R2失败: ${(error as Error).message}`);
  }
}

/**
 * 清理临时文件
 */
export function cleanupTempFile(tempFilePath: string): void {
  try {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`临时文件已清理: ${tempFilePath}`);
    }
  } catch (error) {
    console.error(`清理临时文件失败: ${tempFilePath}`, error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 完整的视频处理流程：下载 -> 上传R2 -> 清理
 */
export async function processVideo(videoUrl: string, taskId: string, userId: number): Promise<string> {
  let tempFilePath: string | null = null;
  
  try {
    // 1. 下载到临时文件
    tempFilePath = await downloadVideoToTemp(videoUrl, taskId);
    
    // 2. 上传到R2
    const r2Url = await uploadTempVideoToR2(tempFilePath, userId);
    
    // 3. 清理临时文件
    cleanupTempFile(tempFilePath);
    
    return r2Url;
    
  } catch (error) {
    // 确保清理临时文件
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
    throw error;
  }
}