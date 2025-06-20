import { Router } from 'express';
import { WebhookController } from '../../controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

router.post('/canva_uninstall', 
  webhookController.canvaUninstall
);

export default router;