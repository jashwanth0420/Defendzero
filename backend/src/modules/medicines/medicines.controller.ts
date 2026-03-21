import { Request, Response } from 'express';
import { MedicinesService } from './medicines.service';
import { z } from 'zod';

const medicinesService = new MedicinesService();

export class MedicinesController {
  
  public async search(req: Request, res: Response): Promise<void> {
    try {
      // Validate the querystring specifically using zod to standardize empty searches vs huge limits
      const { q, limit } = z.object({
        q: z.string().optional(),
        limit: z.coerce.number().int().positive().max(50).default(10) // Limit to 50 max hits to prevent payload spam
      }).parse(req.query);

      const results = await medicinesService.searchMedicines(q || '', limit);
      
      res.status(200).json({ 
        success: true, 
        count: results.length,
        queryFound: q,
        data: results 
      });

    } catch (err: any) {
      if (err instanceof z.ZodError) {
         res.status(400).json({ success: false, error: 'Malformed Query payload', details: err.errors });
      } else {
         res.status(500).json({ success: false, error: err.message });
      }
    }
  }
}
