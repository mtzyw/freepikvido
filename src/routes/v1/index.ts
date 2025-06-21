import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import videoTaskRoutes from './videoTask.routes';
import paymentRoutes from './payment.routes';
import uploadRoutes from './upload.routes';
import webhookRoutes from './webhook.routes';
import { VideoTaskController } from '../../controllers/videoTask.controller';
import { freepikWebhookAuth, webhookRateLimit } from '../../middleware/webhookAuth.middleware';

const router = Router();
const videoTaskController = new VideoTaskController();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/video_tasks', videoTaskRoutes);
router.use('/payment', paymentRoutes);
router.use('/upload', uploadRoutes);
router.use('/webhooks', webhookRoutes);

// 直接的Freepik回调路由 - 带安全认证
router.post('/freepik_callback',
  webhookRateLimit,                    // 1. 频率限制
  freepikWebhookAuth,                  // 2. 认证验证
  videoTaskController.freepikCallback.bind(videoTaskController)  // 3. 业务逻辑
);

export default router;