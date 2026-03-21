import { Request, Response } from 'express';
import { SafetyEngineService } from './safety.service';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const safetyEngineService = new SafetyEngineService();

export class SafetyController {
  
  /**
   * Controllers EXCLUSIVELY validate payload structurally and bridge layers.
   * ALL business logic sits cleanly in the Service layer executing Prisma Postgres queries.
   */
  public async checkInteraction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 1. Controller validation
      const payload = z.object({
        targetMedicineId: z.string().uuid(),
        currentMedicineIds: z.array(z.string().uuid()).default([])
      }).parse(req.body);

      // 2. Extract optionally from implicit Identity (if Patient, attach profile)
      let patientProfile = undefined;
      if (req.user?.isPregnant) {
         patientProfile = {
           isPregnant: req.user.isPregnant,
           trimester: req.user.trimester as 1 | 2 | 3 | null
         };
      }

      // 3. Delegate ALL processing down cleanly
      const result = await safetyEngineService.evaluateSafety(payload, patientProfile);

      // 4. Return Output natively
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
         res.status(400).json({ success: false, error: 'Malformed Payload boundary', details: error.issues });
      } else {
         // Service thrown errors bubble up cleanly
         res.status(403).json({ success: false, error: error.message });
      }
    }
  }
}
