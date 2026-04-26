import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env.config';
import { logger } from '../utils/logger';

interface DailyMedSetIdResult {
  setid?: string;
  title?: string;
}

interface DailyMedSplResponse {
  data?: DailyMedSetIdResult[];
}

interface DailyMedSectionResult {
  title?: string;
  text?: string;
}

interface DailyMedSectionsResponse {
  data?: DailyMedSectionResult[];
}

const DEFAULT_TIMEOUT_MS = config.DAILYMED_TIMEOUT_MS;
const MAX_RETRIES = 2;

export class DailyMedClient {
  private readonly client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client =
      client ??
      axios.create({
        baseURL: 'https://dailymed.nlm.nih.gov/dailymed/services/v2',
        timeout: DEFAULT_TIMEOUT_MS
      });
  }

  public async findLabelTextByDrugName(name: string): Promise<string | null> {
    try {
      const splResponse = await this.getWithRetry<DailyMedSplResponse>('/spls.json', {
        drug_name: name,
        pagesize: '1'
      });

      const setId = splResponse.data?.[0]?.setid;
      if (!setId) {
        return null;
      }

      const sectionsResponse = await this.getWithRetry<DailyMedSectionsResponse>(`/spls/${setId}/sections.json`, {
        pagesize: '100'
      });

      const text = (sectionsResponse.data ?? [])
        .map((section) => `${section.title ?? ''} ${section.text ?? ''}`.trim())
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text || null;
    } catch (error: unknown) {
      logger.warn('DailyMed lookup failed, returning null', { name, error: (error as Error).message });
      return null;
    }
  }

  private async getWithRetry<T>(url: string, params: Record<string, string>): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= MAX_RETRIES) {
      try {
        logger.info('External API call', { url, params, attempt: attempt + 1 });
        const response = await this.client.get<T>(url, { params });
        return response.data;
      } catch (error: unknown) {
        lastError = error;
        logger.warn('External API call failed', {
          url,
          params,
          attempt: attempt + 1,
          error: (error as Error).message
        });

        if (attempt === MAX_RETRIES) {
          throw error;
        }

        attempt += 1;
      }
    }

    throw lastError;
  }
}
