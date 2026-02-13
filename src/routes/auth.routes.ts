import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { verifyJWT } from '@/middlewares/auth.middleware';

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.get('/me', verifyJWT, authController.getMe);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/logout', authController.logout);

export default authRouter;
