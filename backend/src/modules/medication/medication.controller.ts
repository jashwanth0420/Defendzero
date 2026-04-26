import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { MedicationService } from './medication.service';

const medicationService = new MedicationService();

export class MedicationController {
  public async createSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        medicineName: z.string().min(2),
        composition: z.array(z.string().min(1)).default([]),
        dosage: z.string().min(1),
        frequency: z.enum(['DAILY', 'WEEKLY']),
        timingType: z.enum(['BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD']),
        scheduleTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional()
      }).parse(req.body);

      const created = await medicationService.createSchedule(req.user!.id, payload);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
        return;
      }
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async getPrescriptions(req: AuthenticatedRequest, res: Response) {
    const data = await medicationService.getPrescriptions(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  public async getSchedules(req: AuthenticatedRequest, res: Response) {
    const data = await medicationService.getSchedules(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  public async logDose(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        scheduleId: z.string().uuid(),
        status: z.enum(['TAKEN', 'MISSED']),
        date: z.string().optional()
      }).parse(req.body);

      const data = await medicationService.logDose(req.user!.id, payload.scheduleId, payload.status, payload.date);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async getLogs(req: AuthenticatedRequest, res: Response) {
    const query = z.object({ date: z.string().optional() }).parse(req.query);
    const data = await medicationService.getLogs(req.user!.id, query.date);
    res.status(200).json({ success: true, data });
  }

  public async getHistory(req: AuthenticatedRequest, res: Response) {
    const data = await medicationService.getHistory(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  public async uploadPrescription(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        fileUrl: z.string().url().optional(),
        extractedText: z.string().optional(),
        medicines: z.array(z.any()).min(1),
        doctorName: z.string().optional(),
        issuedDate: z.string().optional()
      }).parse(req.body);

      const data = await medicationService.uploadPrescription(req.user!.id, payload);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async confirmPrescription(req: AuthenticatedRequest, res: Response) {
    try {
      const params = z.object({ prescriptionId: z.string().uuid() }).parse(req.params);
      const body = z.object({ medicines: z.array(z.any()).min(1) }).parse(req.body);
      const data = await medicationService.confirmPrescription(req.user!.id, params.prescriptionId, body.medicines);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async generatePurchaseToken(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        prescriptionId: z.string().uuid(),
        maxQuantity: z.number().int().positive(),
        expiryDays: z.number().int().positive().max(90).default(30)
      }).parse(req.body);

      const data = await medicationService.generatePurchaseToken(
        req.user!.id,
        payload.prescriptionId,
        payload.maxQuantity,
        payload.expiryDays
      );
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async validatePurchase(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        token: z.string().min(12),
        medicineName: z.string().min(2),
        quantity: z.number().int().positive()
      }).parse(req.body);

      const data = await medicationService.validatePurchase(req.user!.id, payload.token, payload.medicineName, payload.quantity);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async getPurchases(req: AuthenticatedRequest, res: Response) {
    const data = await medicationService.getPurchases(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  public async getNotifications(req: AuthenticatedRequest, res: Response) {
    const data = await medicationService.getNotifications(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  public async markNotificationRead(req: AuthenticatedRequest, res: Response) {
    try {
      const params = z.object({ notificationId: z.string().uuid() }).parse(req.params);
      const data = await medicationService.markNotificationRead(req.user!.id, params.notificationId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
}
