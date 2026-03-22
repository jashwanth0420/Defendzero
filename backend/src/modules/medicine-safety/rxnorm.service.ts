import { RxNavClient } from '../../clients/rxnav.client';
import { RxNormResult } from './safety.types';

export class RxNormService {
  constructor(private readonly rxNavClient: RxNavClient = new RxNavClient()) {}

  public async resolveRxCuis(medicines: string[]): Promise<RxNormResult[]> {
    const lookups = medicines.map(async (medicine) => {
      const info = await this.rxNavClient.getRxNormInfoByMedicineName(medicine);
      return {
        medicine,
        normalizedName: info.normalizedName,
        rxcui: info.rxcui
      };
    });

    return Promise.all(lookups);
  }
}
