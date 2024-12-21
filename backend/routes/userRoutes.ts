import { Router } from 'express';
import { login } from '../controllers/userController/login.js';
import { logout } from '../controllers/userController/logout.js';
import { searchUsers } from '../controllers/userController/searchUsers.js';
import { updateProfile } from '../controllers/userController/updateProfile.js';
import { RequestHandler } from 'express-serve-static-core';
const router = Router();

router.post('/login', login as RequestHandler);
router.post('/logout', logout as RequestHandler);
router.get('/search', searchUsers as RequestHandler);
router.put('/:userId', updateProfile as RequestHandler);

export default router;

