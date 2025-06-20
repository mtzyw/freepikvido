import { Router } from 'express';
import { UploadController } from '../../controllers/upload.controller';
import { authenticate } from '../../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const uploadController = new UploadController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件上传'));
    }
  },
});

router.post('/image', 
  authenticate,
  upload.single('file'),
  uploadController.uploadImage.bind(uploadController)
);

export default router;