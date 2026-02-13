import { Router } from 'express';
import roundController from '@/controllers/round.controller';

const roundRouter = Router();

roundRouter.get('/get-all-accepted-rounds', roundController.getAllAcceptedRounds)
roundRouter.get('/get-round-detail', roundController.getRoundDetail)
roundRouter.get('/get-all-accepted-rounds/:date', roundController.getAllAcceptedRoundsByDate)

export default roundRouter;
