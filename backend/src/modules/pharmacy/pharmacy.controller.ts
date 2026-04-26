import { Request, Response } from 'express';
import { PharmacyService } from './pharmacy.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { z } from 'zod';

const pharmacyService = new PharmacyService();

export class PharmacyController {
  
  public async generateToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // In production, requireDoctor role usually triggers this via prescribing
      // Or an automated Risk Engine triggers OTC compliance limit requests
      const { patientId, medicineId, maxQuantity } = z.object({
        patientId: z.string().uuid(),
        medicineId: z.string().uuid(),
        maxQuantity: z.number().int().positive()
      }).parse(req.body);

      const token = await pharmacyService.generatePurchaseToken(patientId, medicineId, maxQuantity);
      
      res.status(200).json({ success: true, token, message: `Token bounds set at max ${maxQuantity} units.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public async verifyAndPurchase(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token, requestedQuantity } = z.object({
        token: z.string(),
        requestedQuantity: z.number().int().positive()
      }).parse(req.body);

      // Extract the pharmacy identifier implicitly from the Authenticated request
      const pharmacyId = req.user!.id; 

      const result = await pharmacyService.processPurchase(pharmacyId, token, requestedQuantity);
      res.status(200).json(result);

    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message, status: "TRANSACTION_REJECTED" });
    }
  }

  // --- NEW: Shop CRUD Controllers ---

  public async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const shops = await pharmacyService.getAllPharmacies();
      res.status(200).json({ success: true, data: shops });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        email: z.string().email(),
        name: z.string().min(2),
        storeName: z.string().min(2),
        password: z.string().min(6).optional()
      }).parse(req.body);

      const shop = await pharmacyService.createPharmacy(payload);
      res.status(201).json({ success: true, data: shop });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const payload = z.object({
        email: z.string().email().optional(),
        name: z.string().min(2).optional(),
        storeName: z.string().min(2).optional()
      }).parse(req.body);

      const updated = await pharmacyService.updatePharmacy(id, payload);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      await pharmacyService.deletePharmacy(id);
      res.status(200).json({ success: true, message: 'Pharmacy deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- HEX TOKEN HANDLERS (Delegated to MedicationService) ---
  
  public async getTokenDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { token } = z.object({ token: z.string() }).parse(req.params);
      const { MedicationService } = await import('../medication/medication.service');
      const medService = new MedicationService();
      const details = await medService.getTokenDetails(token);
      res.status(200).json({ success: true, data: details });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  }

  public async validateToken(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        token: z.string(),
        medicineName: z.string(),
        quantity: z.number().int().positive()
      }).parse(req.body);

      const { MedicationService } = await import('../medication/medication.service');
      const medService = new MedicationService();
      
      const result = await medService.validatePurchase(req.user!.id, payload.token, payload.medicineName, payload.quantity);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
