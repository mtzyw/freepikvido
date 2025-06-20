import { uploadImageToR2, UploadResult } from '../utils/fileHandler';

export class UploadService {
  async uploadImage(
    fileBuffer: Buffer,
    originalName: string,
    userId: number,
    mimeType: string
  ): Promise<UploadResult> {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('只支持 JPG, JPEG, PNG 格式的图片');
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      throw new Error('图片文件大小不能超过 10MB');
    }

    try {
      // 上传到 Cloudflare R2
      const result = await uploadImageToR2(fileBuffer, originalName, userId);
      
      return result;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('图片上传失败，请重试');
    }
  }

  validateImageDimensions(width: number, height: number): void {
    // 验证最小分辨率 300x300
    if (width < 300 || height < 300) {
      throw new Error('图片分辨率不能小于 300x300 像素');
    }

    // 验证宽高比 1:2.5 ~ 2.5:1
    const aspectRatio = width / height;
    if (aspectRatio < 1/2.5 || aspectRatio > 2.5) {
      throw new Error('图片宽高比必须在 1:2.5 到 2.5:1 之间');
    }
  }
}