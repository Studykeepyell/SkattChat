import { Router, RequestHandler } from 'express';
import { 
    uploadProfileImage, 
    upload 
} from '../controllers/fileUploadController/index.js';

const router = Router();

router.post('/uploadProfileImage/:userId', upload.single('profileImage'), uploadProfileImage as RequestHandler);
                                                           
export default router;