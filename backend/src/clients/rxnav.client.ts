import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env.config';
import { logger } from '../utils/logger';

interface RxNormIdGroup {
  name?: string;
  rxnormId?: string[];
}

interface RxNormResponse {
  idGroup?: RxNormIdGroup;
}

interface RelatedConcept {
  conceptProperties?: Array<{
    name?: string;
  }>;
}

interface RelatedGroup {
  conceptGroup?: RelatedConcept[];
}

interface RxNormRelatedResponse {
  relatedGroup?: RelatedGroup;
}

interface InteractionConceptItem {
  minConceptItem?: {
    name?: string;
  };
}

interface InteractionPair {
  description?: string;
  severity?: string;
  interactionConcept?: InteractionConceptItem[];
}

interface FullInteractionType {
  sourceName?: string;
  interactionPair?: InteractionPair[];
}

interface FullInteractionTypeGroup {
  fullInteractionType?: FullInteractionType[];
}

interface InteractionListResponse {
  fullInteractionTypeGroup?: FullInteractionTypeGroup[];
}

interface RxNormDrugConceptProperty {
  rxcui?: string;
  name?: string;
  synonym?: string;
  tty?: string;
}

interface RxNormDrugConceptGroup {
  tty?: string;
  conceptProperties?: RxNormDrugConceptProperty[];
}

interface RxNormDrugsResponse {
  drugGroup?: {
    conceptGroup?: RxNormDrugConceptGroup[];
  };
}

const DEFAULT_TIMEOUT_MS = config.RXNAV_TIMEOUT_MS;
const MAX_RETRIES = 2;

export class RxNavClient {
  private readonly client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client =
      client ??
      axios.create({
        baseURL: 'https://rxnav.nlm.nih.gov/REST',
        timeout: DEFAULT_TIMEOUT_MS
      });
  }

  public async getRxCuiByMedicineName(medicine: string): Promise<string | null> {
    const info = await this.getRxNormInfoByMedicineName(medicine);
    return info.rxcui;
  }

  public async getRxNormInfoByMedicineName(medicine: string): Promise<{ rxcui: string | null; normalizedName: string }> {
    try {
      const response = await this.getWithRetry<RxNormResponse>('/rxcui.json', { name: medicine });
      const resolved = response.idGroup?.rxnormId?.[0] ?? null;
      const normalizedName = response.idGroup?.name?.trim() || medicine;
      return { rxcui: resolved, normalizedName };
    } catch (error: unknown) {
      logger.warn('RxNorm lookup failed, returning null rxcui', { medicine, error: (error as Error).message });
      return { rxcui: null, normalizedName: medicine };
    }
  }

  public async getInteractionsByRxCuis(rxcuis: string[]): Promise<FullInteractionTypeGroup[]> {
    if (rxcuis.length < 2) {
      return [];
    }

    try {
      const response = await this.getWithRetry<InteractionListResponse>('/interaction/list.json', {
        rxcuis: rxcuis.join('+')
      });
      return response.fullInteractionTypeGroup ?? [];
    } catch (error: unknown) {
      logger.warn('Interaction lookup failed, returning empty interaction set', {
        rxcuis,
        error: (error as Error).message
      });
      return [];
    }
  }

  public async searchDrugsByName(name: string): Promise<RxNormDrugConceptProperty[]> {
    try {
      const response = await this.getWithRetry<RxNormDrugsResponse>('/drugs.json', { name });
      const groups = response.drugGroup?.conceptGroup ?? [];
      return groups.flatMap((group) => group.conceptProperties ?? []);
    } catch (error: unknown) {
      logger.warn('RxNorm drug search failed, returning empty list', { name, error: (error as Error).message });
      return [];
    }
  }

  public async getIngredientsByRxCui(rxcui: string): Promise<string[]> {
    try {
      const response = await this.getWithRetry<RxNormRelatedResponse>(`/rxcui/${rxcui}/related.json`, { tty: 'IN' });

      const ingredients = (response.relatedGroup?.conceptGroup ?? [])
        .flatMap((group) => group.conceptProperties ?? [])
        .map((item) => item.name?.trim())
        .filter((name): name is string => Boolean(name));

      return Array.from(new Set(ingredients));
    } catch (error: unknown) {
      logger.warn('RxNorm ingredient lookup failed, returning empty ingredient list', {
        rxcui,
        error: (error as Error).message
      });
      return [];
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

export type {
  FullInteractionTypeGroup,
  FullInteractionType,
  InteractionPair,
  InteractionConceptItem,
  InteractionListResponse,
  RxNormResponse,
  RxNormDrugConceptProperty,
  RxNormRelatedResponse
};
