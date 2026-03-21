import { Response } from 'express';
import { AdherenceService } from './adherence.service';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const adherenceService = new AdherenceService();

export class AdherenceController {
  public async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        medicineId: z.string().uuid(),
        dosage: z.string(),
        frequency: z.enum(['DAILY', 'WEEKLY']),
        timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
        startDate: z.string().datetime(),
        endDate: z.string().datetime().nullable().optional(),
        mealRelation: z.enum(['BEFORE_MEAL', 'WITH_MEAL', 'AFTER_MEAL', 'NONE']).default('NONE')
      }).parse(req.body);

      const userId = req.user!.id; // Authenticated user
      const schedule = await adherenceService.createSchedule(userId, payload);

      res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  public async log(req: AuthenticatedRequest, res: Response) {
    try {
      const { scheduleId } = z.object({
        scheduleId: z.string().uuid()
      }).parse(req.params);

      const { status } = z.object({
        status: z.enum(['TAKEN', 'MISSED', 'SKIPPED'])
      }).parse(req.body);

      const userId = req.user!.id;
      const log = await adherenceService.logAdherence(userId, scheduleId, status);

      res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
      } else {
        res.status(403).json({ success: false, error: error.message });
      }
    }
  }

  public async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const schedules = await adherenceService.getSchedules(userId);

      res.status(200).json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  }
}
