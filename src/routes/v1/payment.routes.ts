import { Router } from 'express';
import { PaymentController } from '../../controllers/payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { paymentValidation } from '../../utils/validations';

const router = Router();
const paymentController = new PaymentController();

router.post('/orders', 
  authenticate,
  validate(paymentValidation.createOrder), 
  paymentController.createOrder
);

router.post('/apple/callback', 
  paymentController.appleCallback
);

router.post('/stripe/webhook', 
  paymentController.stripeWebhook
);

export default router;