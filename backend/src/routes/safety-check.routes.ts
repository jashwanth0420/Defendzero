import { Router } from 'express';
import { MedicineSafetyController } from '../modules/medicine-safety/safety.controller';

const safetyCheckRouter = Router();
const controller = new MedicineSafetyController();

safetyCheckRouter.post('/safety-check', controller.checkSafety);

export default safetyCheckRouter;
