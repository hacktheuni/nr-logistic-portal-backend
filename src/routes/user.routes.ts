import { Router } from 'express';
import userController from '@/controllers/user.controller';

const userRouter = Router();

userRouter.post('/create-user', userController.createUser);
userRouter.put('/update-user/:id', userController.updateUser);
userRouter.delete('/deactivate-user/:id', userController.deactivateUser);
userRouter.get('/get-user/:id', userController.getUser);
userRouter.get('/get-all-users', userController.getAllUsers);
userRouter.get('/get-all-active-users', userController.getAllActiveUsers);
userRouter.get('/get-all-deactive-users', userController.getAllDeactiveUsers);

export default userRouter;
