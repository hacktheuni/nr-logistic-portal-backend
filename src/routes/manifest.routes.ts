import { Router } from 'express';
import manifestController from '@/controllers/manifest.controller';

const manifestRouter = Router();

manifestRouter.get('/get-all-manifests/:roundId', manifestController.getAllManifestsByRoundId)
manifestRouter.get('/get-manifest-detail/:manifestId', manifestController.getManifestDetail)

export default manifestRouter;
