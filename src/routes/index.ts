import { Router } from 'express';
import driverRouter from './driver.routes';
import authRouter from './auth.routes';
import manifestRouter from './manifest.routes';
import reviewRouter from './review.routes';
import roundRouter from './round.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/drivers', driverRouter);
apiRouter.use('/manifests', manifestRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/rounds', roundRouter);
