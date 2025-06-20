import { Request, Response, NextFunction } from 'express';
import { VideoTaskService } from '../services/videoTask.service';
import { processVideo } from '../utils/videoHandler';

interface ApiError extends Error {
  statusCode?: number;
  code?: number;
}

export class VideoTaskController {
  private videoTaskService: VideoTaskService;

  constructor() {
    this.videoTaskService = new VideoTaskService();
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { 
        task_type, 
        prompt, 
        duration, 
        image_url, 
        negative_prompt, 
        cfg_scale, 
        static_mask_url, 
        aspect_ratio 
      } = req.body;

      const task = await this.videoTaskService.createTask({
        userId,
        taskType: task_type,
        prompt,
        durationSeconds: duration,
        imageUrl: image_url,
        negativePrompt: negative_prompt,
        cfgScale: cfg_scale,
        staticMaskUrl: static_mask_url,
        aspectRatio: aspect_ratio,
      });

      res.status(200).json({
        success: true,
        message: '视频任务创建成功',
        data: {
          task_id: task.taskId,
          task_type: task.taskType,
          status: task.status,
          created_at: task.createdAt,
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      apiError.statusCode = 400;
      apiError.code = 4003;
      next(apiError);
    }
  }

  async getTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const userId = (req as any).userId;

      const task = await this.videoTaskService.getTaskById(taskId, userId);

      if (!task) {
        const error = new Error('视频任务不存在') as ApiError;
        error.statusCode = 404;
        error.code = 4004;
        throw error;
      }

      res.status(200).json({
        success: true,
        message: '获取任务状态成功',
        data: {
          task_id: task.taskId,
          task_type: task.taskType,
          status: task.status,
          prompt: task.prompt,
          image_url: task.imageUrl,
          thumbnail_url: task.thumbnailUrl,
          video_url: task.videoUrl,
          duration_seconds: task.durationSeconds,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      if (!apiError.statusCode) {
        apiError.statusCode = 500;
        apiError.code = 5002;
      }
      next(apiError);
    }
  }

  async getUserTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { page = 1, limit = 10 } = req.query;

      const result = await this.videoTaskService.getUserTasks(
        userId,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        message: '获取用户视频任务列表成功',
        data: {
          tasks: result.tasks.map(task => ({
            task_id: task.taskId,
            task_type: task.taskType,
            status: task.status,
            prompt: task.prompt,
            thumbnail_url: task.thumbnailUrl,
            duration_seconds: task.durationSeconds,
            created_at: task.createdAt,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit)),
          },
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      apiError.statusCode = 500;
      apiError.code = 5002;
      next(apiError);
    }
  }

  async freepikCallback(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: 添加IP白名单或签名验证确保请求来自Freepik
      
      console.log('收到原始回调数据:', JSON.stringify(req.body, null, 2));
      
      // 检查回调格式 - Freepik直接发送data字段作为根对象
      let callbackData;
      if (req.body.data) {
        // 格式: { data: { task_id, status, generated } }
        callbackData = req.body.data;
      } else if (req.body.task_id) {
        // 格式: { task_id, status, generated }
        callbackData = req.body;
      } else {
        throw new Error('Invalid callback format: missing required fields');
      }
      
      const { task_id, status, generated, error_message } = callbackData;
      const video_url = generated && generated.length > 0 ? generated[0] : null;
      
      console.log('解析后的回调数据:', { task_id, status, video_url });

      // 根据Freepik任务ID查找内部任务
      const task = await this.videoTaskService.getTaskByFreepikId(task_id);
      if (!task) {
        const error = new Error(`未找到Freepik任务ID: ${task_id}`) as ApiError;
        error.statusCode = 404;
        error.code = 4004;
        throw error;
      }

      if (status === 'COMPLETED') {
        if (video_url) {
          // 成功状态：下载视频并上传到R2
          await this.processSuccessfulTask(task, video_url);
        } else {
          // COMPLETED但没有视频URL
          await this.videoTaskService.updateTaskStatus(
            task.taskId,
            'failed' as any,
            undefined,
            undefined,
            'Freepik任务完成但未返回视频URL'
          );
        }
      } else {
        // 失败状态：更新错误信息
        await this.videoTaskService.updateTaskStatus(
          task.taskId,
          'failed' as any,
          undefined,
          undefined,
          error_message || `视频生成失败，状态：${status}`
        );
      }

      res.status(200).json({
        status: 'success',
        message: 'Callback processed',
      });
    } catch (error) {
      console.error('Freepik回调处理失败:', error);
      const apiError = error as ApiError;
      if (!apiError.statusCode) {
        apiError.statusCode = 500;
        apiError.code = 5003;
      }
      next(apiError);
    }
  }

  /**
   * 处理成功的任务：下载视频并上传到R2
   */
  private async processSuccessfulTask(task: any, videoUrl: string, thumbnailUrl?: string) {
    try {
      console.log(`开始处理任务 ${task.taskId} 的视频下载和上传`);
      console.log(`原始视频URL: ${videoUrl}`);
      
      // 完整的视频处理流程：下载 -> 上传R2 -> 清理
      const finalVideoUrl = await processVideo(videoUrl, task.taskId, task.userId);
      
      // 更新任务状态为成功，使用R2的永久URL，并清空错误信息
      await this.videoTaskService.updateTaskStatus(
        task.taskId,
        'success' as any,
        finalVideoUrl,
        thumbnailUrl,
        null // 清空错误信息
      );
      
      console.log(`任务 ${task.taskId} 处理完成，最终视频URL: ${finalVideoUrl}`);
    } catch (error) {
      console.error('处理成功任务失败:', error);
      // 标记任务为失败
      await this.videoTaskService.updateTaskStatus(
        task.taskId,
        'failed' as any,
        undefined,
        undefined,
        `视频处理失败: ${(error as Error).message}`
      );
    }
  }
}