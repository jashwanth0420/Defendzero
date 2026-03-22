import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface OpenFdaDrugLabelResult {
  id?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    substance_name?: string[];
  };
  active_ingredient?: string[];
  warnings?: string[];
  contraindications?: string[];
  precautions?: string[];
  pregnancy?: string[];
}

interface OpenFdaDrugLabelResponse {
  results?: OpenFdaDrugLabelResult[];
}

const DEFAULT_TIMEOUT_MS = Number(process.env.OPENFDA_TIMEOUT_MS ?? 4000);
const MAX_RETRIES = 2;

export class FdaClient {
  private readonly client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client =
      client ??
      axios.create({
        baseURL: 'https://api.fda.gov',
        timeout: DEFAULT_TIMEOUT_MS
      });
  }

  public async findDrugLabelByName(name: string): Promise<OpenFdaDrugLabelResult | null> {
    const search = `openfda.brand_name.exact:\"${name}\"+openfda.generic_name.exact:\"${name}\"`;
    try {
      const response = await this.getWithRetry<OpenFdaDrugLabelResponse>('/drug/label.json', {
        search,
        limit: '1'
      });
      return response.results?.[0] ?? null;
    } catch (error: unknown) {
      logger.warn('FDA name lookup failed, returning null', { name, error: (error as Error).message });
      return null;
    }
  }

  public async findDrugLabelByGenericName(genericName: string): Promise<OpenFdaDrugLabelResult | null> {
    const search = `openfda.generic_name.exact:\"${genericName}\"`;
    try {
      const response = await this.getWithRetry<OpenFdaDrugLabelResponse>('/drug/label.json', {
        search,
        limit: '1'
      });
      return response.results?.[0] ?? null;
    } catch (error: unknown) {
      logger.warn('FDA generic lookup failed, returning null', {
        genericName,
        error: (error as Error).message
      });
      return null;
    }
  }

  public async findDrugLabelByIngredient(ingredient: string): Promise<OpenFdaDrugLabelResult | null> {
    const search = `openfda.substance_name.exact:\"${ingredient}\"+active_ingredient:\"${ingredient}\"`;
    try {
      const response = await this.getWithRetry<OpenFdaDrugLabelResponse>('/drug/label.json', {
        search,
        limit: '1'
      });
      return response.results?.[0] ?? null;
    } catch (error: unknown) {
      logger.warn('FDA ingredient lookup failed, returning null', {
        ingredient,
        error: (error as Error).message
      });
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

export type { OpenFdaDrugLabelResult };
