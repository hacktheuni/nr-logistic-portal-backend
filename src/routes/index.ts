import { Router } from 'express';
import userRouter from './user.routes';
import authRouter from './auth.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
