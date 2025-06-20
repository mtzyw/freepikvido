import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { userValidation } from '../../utils/validations';

const router = Router();
const userController = new UserController();

router.put('/profile', 
  authenticate,
  validate(userValidation.updateProfile), 
  userController.updateProfile
);

router.get('/memberships', 
  authenticate,
  userController.getMemberships
);

router.get('/products', 
  userController.getProducts
);

export default router;