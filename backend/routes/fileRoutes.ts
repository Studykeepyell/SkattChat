import { Router, RequestHandler } from 'express';
import { 
    uploadProfileImage, 
    getUserProfileImage, 
    upload 
} from '../controllers/fileUploadController/index.js';

const router = Router();

router.post('/uploadProfileImage/:userId', upload.single('profileImage'), uploadProfileImage as RequestHandler);
router.get('/getUserProfileImage/:userId', getUserProfileImage as RequestHandler);

export default router;