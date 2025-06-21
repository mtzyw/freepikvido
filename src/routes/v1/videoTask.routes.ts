import { Router } from 'express';
import { VideoTaskController } from '../../controllers/videoTask.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { freepikWebhookAuth } from '../../middleware/webhookAuth.middleware';
import { videoTaskValidation } from '../../utils/validations';

const router = Router();
const videoTaskController = new VideoTaskController();

router.post('/', 
  authenticate,
  validate(videoTaskValidation.createTask), 
  videoTaskController.createTask.bind(videoTaskController)
);

router.get('/', 
  authenticate,
  videoTaskController.getUserTasks.bind(videoTaskController)
);

router.get('/:taskId', 
  authenticate,
  videoTaskController.getTaskStatus.bind(videoTaskController)
);

router.post('/freepik_callback',
  freepikWebhookAuth,
  videoTaskController.freepikCallback.bind(videoTaskController)
);

export default router;