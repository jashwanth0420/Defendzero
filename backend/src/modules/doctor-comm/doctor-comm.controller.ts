import { Response } from 'express';
import { DoctorCommService } from './doctor-comm.service';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const doctorCommService = new DoctorCommService();

export class DoctorCommController {
  
  public async send(req: AuthenticatedRequest, res: Response) {
    try {
      const { receiverId, content } = z.object({
        receiverId: z.string().uuid(),
        content: z.string().min(1)
      }).parse(req.body);

      const senderId = req.user!.id;
      const result = await doctorCommService.sendMessage(senderId, receiverId, content);

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(403).json({ success: false, error: error.message });
    }
  }

  public async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const messages = await doctorCommService.getMessages(userId);
      res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  }
}
