import { Router } from 'express';
import { login } from '../controllers/authController/login.js';
import { register } from '../controllers/authController/register.js';
import { logout } from '../controllers/authController/logout.js';
import { refreshToken } from '../controllers/authController/refreshToken.js';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Authentication routes
router.post('/login', login as RequestHandler);
router.post('/register', register as RequestHandler);
router.post('/logout', logout as RequestHandler);
router.post('/refresh-token', refreshToken as RequestHandler);

export default router;
