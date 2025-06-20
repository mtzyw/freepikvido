import { Router } from 'express';
import { VideoTaskController } from '../../controllers/videoTask.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { videoTaskValidation } from '../../utils/validations';

const router = Router();
const videoTaskController = new VideoTaskController();

router.post('/', 
  authenticate,
  validate(videoTaskValidation.createTask), 
  videoTaskController.createTask
);

router.get('/:taskId', 
  authenticate,
  videoTaskController.getTaskStatus
);

router.post('/freepik_callback', 
  videoTaskController.freepikCallback
);

export default router;