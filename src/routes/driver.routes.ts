import { Router } from 'express';
import driverController from '@/controllers/driver.controller';

const driverRouter = Router();

driverRouter.post('/create-driver', driverController.createDriver);
driverRouter.put('/update-driver/:id', driverController.updateDriver);
driverRouter.delete('/deactivate-driver/:id', driverController.deactivateDriver);
driverRouter.get('/get-driver/:id', driverController.getDriver);
driverRouter.get('/get-all-drivers', driverController.getAllDrivers);

export default driverRouter;
