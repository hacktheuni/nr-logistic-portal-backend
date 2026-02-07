import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { verifyJWT, authorizeRoles } from '@/middlewares/auth.middleware';

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.get('/me', verifyJWT, authController.getMe);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/logout', authController.logout);

// Admin-only routes for third-party app connection
authRouter.post('/connect-app', verifyJWT, authorizeRoles('ADMIN'), authController.connectApp);
authRouter.post('/disconnect-app', verifyJWT, authorizeRoles('ADMIN'), authController.disconnectApp);

export default authRouter;
