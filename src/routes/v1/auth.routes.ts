import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import { authValidation } from '../../utils/validations';

const router = Router();
const authController = new AuthController();

router.post('/register', 
  authRateLimiter,
  validate(authValidation.register), 
  authController.register.bind(authController)
);

router.post('/login', 
  authRateLimiter,
  validate(authValidation.login), 
  authController.login.bind(authController)
);

router.post('/oauth_login', 
  authRateLimiter,
  validate(authValidation.oauthLogin), 
  authController.oauthLogin.bind(authController)
);

router.post('/token/refresh', 
  validate(authValidation.refreshToken), 
  authController.refreshToken.bind(authController)
);

router.post('/password/forgot', 
  authRateLimiter,
  validate(authValidation.forgotPassword), 
  authController.forgotPassword.bind(authController)
);

router.post('/password/reset', 
  authRateLimiter,
  validate(authValidation.resetPassword), 
  authController.resetPassword.bind(authController)
);

export default router;