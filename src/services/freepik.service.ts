import axios from 'axios';
import config from '../config';

export interface FreepikTaskRequest {
  taskType: 'image_to_video' | 'text_to_video';
  prompt: string;
  duration: number;
  imageUrl?: string;
  negativePrompt?: string;
  cfgScale?: number;
  staticMaskUrl?: string;
  aspectRatio?: string;
  webhookUrl?: string;
}

export interface FreepikTaskResponse {
  data: {
    task_id: string;
    status: string;
  };
}

export class FreepikService {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = config.freepik.apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * 提交视频生成任务到Freepik API
   */
  async submitVideoTask(request: FreepikTaskRequest): Promise<FreepikTaskResponse> {
    const url = `${this.baseUrl}/ai/image-to-video/kling-v2-1-master`;
    
    // 构建请求参数，根据API文档要求
    const payload: any = {
      duration: request.duration.toString(), // API要求字符串格式
      prompt: request.prompt,
      negative_prompt: request.negativePrompt || '',
      cfg_scale: request.cfgScale || 0.5,
    };

    // 添加webhook_url (如果提供)
    if (request.webhookUrl) {
      payload.webhook_url = request.webhookUrl;
    }

    // 根据任务类型添加特定参数
    if (request.taskType === 'image_to_video') {
      if (!request.imageUrl) {
        throw new Error('图生视频任务必须提供图片URL');
      }
      payload.image = request.imageUrl; // API参数名是'image'而不是'image_url'
      
      // 如果有静态遮罩，添加到请求中 (注意：API文档中未明确说明此参数，可能需要调整)
      if (request.staticMaskUrl) {
        payload.static_mask = request.staticMaskUrl;
      }
    } else if (request.taskType === 'text_to_video') {
      // 文生视频需要宽高比参数
      payload.aspect_ratio = request.aspectRatio || 'widescreen_16_9';
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'x-freepik-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30秒超时
      });

      return response.data;
    } catch (error) {
      console.error('Freepik API调用失败:', error);
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Freepik API错误: ${message}`);
      }
      
      throw new Error('Freepik API调用失败');
    }
  }

  /**
   * 查询任务状态（如果需要主动查询的话）
   */
  async getTaskStatus(taskId: string): Promise<any> {
    // 这个方法可能需要根据Freepik的实际API来实现
    // 目前文档中没有明确的查询接口，主要依赖webhook回调
    const url = `${this.baseUrl}/ai/tasks/${taskId}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'x-freepik-api-key': this.apiKey,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('查询Freepik任务状态失败:', error);
      throw new Error('查询任务状态失败');
    }
  }
}