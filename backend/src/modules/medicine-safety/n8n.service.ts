import axios from 'axios';
import { config } from '../../config/env.config';

export interface N8nMedicineResult {
  drug_1: string;
  drug_2: string;
  risk: string;
  severity: string;
  evidence?: string;
}

export class N8nSafetyService {
  private readonly webhookUrl =
    config.N8N_WEBHOOK_URL || 'https://n8n-production-fc4a.up.railway.app/webhook-test/medicine-check';

  public async checkSafety(medicines: string[]): Promise<N8nMedicineResult[]> {
    try {
      console.log(`[Backend] Proxying safety check to n8n for: ${medicines.join(', ')}`);
      
      const response = await axios.post<{ results: N8nMedicineResult[] }>(this.webhookUrl, {
        medicines: medicines
      });

      if (!response.data || !response.data.results) {
        console.warn('[Backend] N8N returned empty or malformed response body');
        return [];
      }

      return response.data.results;
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Unknown network error';

      if (status === 404) {
        throw new Error('N8N webhook is inactive. Please ensure the workflow is listening (click Test or use Production URL).');
      }
      
      throw new Error(`N8N Service Failure (${status || 'Network'}): ${message}`);
    }
  }
}
