import { Response } from 'express';
import { DoctorService } from './doctor.service';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const doctorService = new DoctorService();

export class DoctorController {

  /**
   * Endpoint: POST /doctor/patients
   */
  public async addPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = z.object({
        email: z.string().email(),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        phone: z.string().optional(),
        isPregnant: z.boolean().default(false),
        trimester: z.number().int().min(1).max(3).nullable().optional()
      }).parse(req.body);

      const doctorId = req.user!.id;
      const patient = await doctorService.createPatient(doctorId, payload);
      
      res.status(201).json({ success: true, data: patient });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Endpoint: POST /doctor/prescriptions
   */
  public async createPrescription(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, medicines } = z.object({
        patientId: z.string().uuid(),
        medicines: z.array(z.object({
          medicineId: z.string().uuid(),
          dosage: z.string(),
          frequency: z.string().default('DAILY'),
          timeOfDay: z.string().default('08:00')
        }))
      }).parse(req.body);

      const doctorId = req.user!.id;
      const prescription = await doctorService.createPrescription(doctorId, patientId, medicines);
      
      res.status(201).json({ success: true, data: prescription });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Endpoint: GET /doctor/patients
   */
  public async getMyPatients(req: AuthenticatedRequest, res: Response) {
    try {
      const doctorId = req.user!.id;
      const patients = await doctorService.getDoctorPatients(doctorId);
      
      res.status(200).json({ success: true, data: patients });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
