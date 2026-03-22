import { describe, expect, it, jest } from '@jest/globals';
import { RxNormService } from '../../src/modules/medicine-safety/rxnorm.service';

describe('RxNormService', () => {
  it('maps each medicine to its rxcui and preserves medicine names', async () => {
    const outputs: Array<{ rxcui: string | null; normalizedName: string }> = [
      { rxcui: '11289', normalizedName: 'warfarin' },
      { rxcui: null, normalizedName: 'randomfake123' },
      { rxcui: '197361', normalizedName: 'amoxicillin' }
    ];
    const mockClient = {
      getRxNormInfoByMedicineName: jest
        .fn()
        .mockImplementation(async () => outputs.shift() ?? { rxcui: null, normalizedName: 'unknown' })
    };

    const service = new RxNormService(mockClient as any);

    const result = await service.resolveRxCuis(['warfarin', 'randomfake123', 'amoxicillin']);

    expect(result).toEqual([
      { medicine: 'warfarin', normalizedName: 'warfarin', rxcui: '11289' },
      { medicine: 'randomfake123', normalizedName: 'randomfake123', rxcui: null },
      { medicine: 'amoxicillin', normalizedName: 'amoxicillin', rxcui: '197361' }
    ]);
    expect(mockClient.getRxNormInfoByMedicineName).toHaveBeenCalledTimes(3);
  });
});
