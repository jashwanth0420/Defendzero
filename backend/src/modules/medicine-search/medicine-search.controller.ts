import { Request, Response } from 'express';
import { z } from 'zod';
import { MedicineSearchService } from './medicine-search.service';

const searchSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters')
});

export class MedicineSearchController {
  constructor(private readonly medicineSearchService: MedicineSearchService = new MedicineSearchService()) {}

  public search = async (req: Request, res: Response): Promise<void> => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid search query',
        details: parsed.error.issues
      });
      return;
    }

    const results = await this.medicineSearchService.search(parsed.data.q);
    res.status(200).json(results);
  };
}
