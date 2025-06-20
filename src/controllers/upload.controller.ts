import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import sharp from 'sharp';

interface ApiError extends Error {
  statusCode?: number;
  code?: number;
}

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      // 检查是否有文件上传
      if (!req.file) {
        const error = new Error('请选择要上传的图片文件') as ApiError;
        error.statusCode = 400;
        error.code = 4002;
        throw error;
      }

      // 获取用户ID
      const userId = (req as any).userId;
      if (!userId) {
        const error = new Error('用户未认证') as ApiError;
        error.statusCode = 401;
        error.code = 4012;
        throw error;
      }

      const file = req.file;
      
      // 使用 Sharp 获取图片信息和验证
      const imageInfo = await sharp(file.buffer).metadata();
      
      if (!imageInfo.width || !imageInfo.height) {
        const error = new Error('无法读取图片信息，请检查文件格式') as ApiError;
        error.statusCode = 400;
        error.code = 4002;
        throw error;
      }

      // 验证图片尺寸
      this.uploadService.validateImageDimensions(imageInfo.width, imageInfo.height);

      // 上传图片
      const result = await this.uploadService.uploadImage(
        file.buffer,
        file.originalname,
        userId,
        file.mimetype
      );

      res.status(200).json({
        success: true,
        message: '图片上传成功',
        data: {
          image_url: result.url,
          file_key: result.key,
          dimensions: {
            width: imageInfo.width,
            height: imageInfo.height,
          },
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      if (!apiError.statusCode) {
        apiError.statusCode = 500;
        apiError.code = 5001;
      }
      next(apiError);
    }
  }
}