import { PrismaClient, VideoTask, TaskStatus, TaskType } from '@prisma/client';
import { FreepikService, FreepikTaskRequest } from './freepik.service';
import config from '../config';

const prisma = new PrismaClient();

interface CreateTaskData {
  userId: number;
  taskType: TaskType;
  prompt: string;
  durationSeconds: number;
  imageUrl?: string;
  negativePrompt?: string;
  cfgScale?: number;
  staticMaskUrl?: string;
  aspectRatio?: string;
}

interface TasksResult {
  tasks: VideoTask[];
  total: number;
}

export class VideoTaskService {
  async createTask(data: CreateTaskData): Promise<VideoTask> {
    // 验证任务类型和必需参数
    if (data.taskType === 'image_to_video' && !data.imageUrl) {
      throw new Error('图生视频任务需要提供图片URL');
    }

    // 创建任务记录
    const task = await prisma.videoTask.create({
      data: {
        userId: data.userId,
        taskType: data.taskType,
        prompt: data.prompt,
        durationSeconds: data.durationSeconds,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.imageUrl, // thumbnail_url 直接使用 image_url 的值
        negativePrompt: data.negativePrompt,
        cfgScale: data.cfgScale,
        staticMaskUrl: data.staticMaskUrl,
        aspectRatio: data.aspectRatio,
        status: TaskStatus.pending,
      },
    });

    // 异步提交到Freepik API
    this.submitToFreepikAPI(task).catch(error => {
      console.error('提交Freepik API失败:', error);
      // 更新任务状态为失败
      this.updateTaskStatus(task.taskId, TaskStatus.failed, undefined, undefined, error.message);
    });

    return task;
  }

  async getTaskById(taskId: string, userId: number): Promise<VideoTask | null> {
    return await prisma.videoTask.findFirst({
      where: {
        taskId,
        userId,
      },
    });
  }

  async getUserTasks(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<TasksResult> {
    const offset = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.videoTask.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.videoTask.count({
        where: { userId },
      }),
    ]);

    return { tasks, total };
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    videoUrl?: string,
    thumbnailUrl?: string,
    errorMsg?: string | null,
    freepikTaskId?: string
  ): Promise<VideoTask> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (freepikTaskId !== undefined) updateData.freepikTaskId = freepikTaskId;
    
    // 明确处理errorMsg: null表示清空，undefined表示不更新
    if (errorMsg !== undefined) {
      updateData.errorMsg = errorMsg;
    }

    return await prisma.videoTask.update({
      where: { taskId },
      data: updateData,
    });
  }

  async getAllPendingTasks(): Promise<VideoTask[]> {
    return await prisma.videoTask.findMany({
      where: { status: TaskStatus.pending },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 提交任务到Freepik API
   */
  private async submitToFreepikAPI(task: VideoTask): Promise<void> {
    try {
      // 获取API密钥 (这里简化处理，实际应该从数据库获取可用的API Key)
      const apiKey = config.freepik.apiKey;
      if (!apiKey) {
        throw new Error('Freepik API密钥未配置');
      }

      const freepikService = new FreepikService(apiKey);
      
      // 构建Freepik API请求
      const request: FreepikTaskRequest = {
        taskType: task.taskType as 'image_to_video' | 'text_to_video',
        prompt: task.prompt || '',
        duration: task.durationSeconds,
        imageUrl: task.imageUrl || undefined,
        negativePrompt: task.negativePrompt || undefined,
        cfgScale: task.cfgScale ? Number(task.cfgScale) : undefined,
        staticMaskUrl: task.staticMaskUrl || undefined,
        aspectRatio: task.aspectRatio || undefined,
        webhookUrl: config.freepik.webhookUrl,
      };

      // 调用Freepik API
      const response = await freepikService.submitVideoTask(request);
      
      // 更新任务状态和Freepik任务ID
      await this.updateTaskStatus(
        task.taskId,
        TaskStatus.processing,
        undefined,
        undefined,
        undefined,
        response.data.task_id
      );
      
      console.log(`任务 ${task.taskId} 已提交到Freepik API，Freepik任务ID: ${response.data.task_id}`);
    } catch (error) {
      console.error('提交Freepik API失败:', error);
      throw error;
    }
  }

  /**
   * 根据Freepik任务ID查找内部任务
   */
  async getTaskByFreepikId(freepikTaskId: string): Promise<VideoTask | null> {
    return await prisma.videoTask.findFirst({
      where: { freepikTaskId },
    });
  }
}