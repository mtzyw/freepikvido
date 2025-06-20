import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import videoTaskRoutes from './videoTask.routes';
import paymentRoutes from './payment.routes';
import uploadRoutes from './upload.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/video_tasks', videoTaskRoutes);
router.use('/payment', paymentRoutes);
router.use('/upload', uploadRoutes);
router.use('/webhooks', webhookRoutes);

export default router;