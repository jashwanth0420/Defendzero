import { NextFunction, Request, Response } from 'express';
import { safetyCheckSchema } from './safety.schema';
import { SafetyEngineService } from './safety-engine.service';

export class MedicineSafetyController {
  constructor(private readonly safetyEngineService: SafetyEngineService = new SafetyEngineService()) {}

  public checkSafety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = safetyCheckSchema.parse(req.body);
      const result = await this.safetyEngineService.runSafetyCheck(payload);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  };
}
