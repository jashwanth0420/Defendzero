import { Response } from 'express';
import { GuardianService } from './guardian.service';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const guardianService = new GuardianService();

export class GuardianController {
  
  public async add(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = z.object({
        patientId: z.string().uuid()
      }).parse(req.body);

      const guardianId = req.user!.id; // Current user is guardian
      const result = await guardianService.addMapping(guardianId, patientId);

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(403).json({ success: false, error: error.message });
    }
  }

  public async getPatients(req: AuthenticatedRequest, res: Response) {
    try {
      const guardianId = req.user!.id;
      const patients = await guardianService.getPatients(guardianId);
      res.status(200).json({ success: true, data: patients });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  public async getMyGuardians(req: AuthenticatedRequest, res: Response) {
    try {
      const patientId = req.user!.id;
      const guardians = await guardianService.getGuardians(patientId);
      res.status(200).json({ success: true, data: guardians });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  }
  public async getPatientDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = z.object({ patientId: z.string().uuid() }).parse(req.params);
      const data = await guardianService.getPatientFullStory(req.user!.id, patientId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(403).json({ success: false, error: error.message });
    }
  }
}
