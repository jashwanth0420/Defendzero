import { describe, expect, it, jest } from '@jest/globals';
import { SafetyEngineService } from '../../src/modules/medicine-safety/safety-engine.service';

describe('SafetyEngineService', () => {
  it('returns HIGH risk when interactions exist', async () => {
    const rxNormService = {
      resolveRxCuis: jest.fn().mockImplementation(async () => [
        { medicine: 'warfarin', normalizedName: 'warfarin', rxcui: '11289' },
        { medicine: 'amoxicillin', normalizedName: 'amoxicillin', rxcui: '197361' }
      ])
    };

    const interactionService = {
      getStructuredInteractions: jest.fn().mockImplementation(async () => ({
        interactionChecked: true,
        interactions: [
          {
            source: 'rxnav',
            pair: ['warfarin', 'amoxicillin'],
            description: 'Potential interaction',
            severity: 'high'
          }
        ]
      }))
    };

    const legitimacyService = {
      checkMedicineLegitimacy: jest.fn().mockImplementation(async (...args: any[]) => {
        const [entry, rxcui] = args;
        return {
          name: entry.name,
          normalizedName: entry.name,
          rxcui,
          compositionMatch: 'EXACT_MATCH',
          sources: { rxnorm: true, fda: true, dailymed: false },
          legitimacyScore: 90,
          legitimacyStatus: 'VERIFIED',
          pregnancySafety: 'SAFE',
          notes: []
        };
      })
    };

    const service = new SafetyEngineService(rxNormService as any, interactionService as any, legitimacyService as any);

    const result = await service.runSafetyCheck({
      medicineEntries: [
        { name: 'warfarin', composition: ['warfarin sodium'] },
        { name: 'amoxicillin', composition: ['amoxicillin trihydrate'] }
      ],
      pregnancyStage: 'unknown'
    });

    expect(result.risk).toBe('HIGH');
    expect(result.alerts).toContain('Pregnancy stage is unknown. Worst-case safety handling has been applied.');
  });

  it('detects duplicates and surfaces alert', async () => {
    const rxNormService = {
      resolveRxCuis: jest.fn().mockImplementation(async () => [
        { medicine: 'cetirizine', normalizedName: 'cetirizine', rxcui: '20610' },
        { medicine: 'cetirizine', normalizedName: 'cetirizine', rxcui: '20610' }
      ])
    };

    const interactionService = {
      getStructuredInteractions: jest.fn().mockImplementation(async () => ({
        interactionChecked: true,
        interactions: []
      }))
    };

    const legitimacyService = {
      checkMedicineLegitimacy: jest.fn().mockImplementation(async (...args: any[]) => {
        const [entry, rxcui] = args;
        return {
          name: entry.name,
          normalizedName: entry.name,
          rxcui,
          compositionMatch: 'EXACT_MATCH',
          sources: { rxnorm: true, fda: true, dailymed: false },
          legitimacyScore: 90,
          legitimacyStatus: 'VERIFIED',
          pregnancySafety: 'SAFE',
          notes: []
        };
      })
    };

    const service = new SafetyEngineService(rxNormService as any, interactionService as any, legitimacyService as any);

    const result = await service.runSafetyCheck({
      medicineEntries: [
        { name: 'cetirizine', composition: ['cetirizine hydrochloride'] },
        { name: 'cetirizine', composition: ['cetirizine hydrochloride'] }
      ],
      pregnancyStage: 'second'
    });

    expect(result.alerts.some((alert) => alert.includes('Duplicate medicines detected'))).toBe(true);
    expect(result.risk).toBe('MEDIUM');
  });

  it('escalates to HIGH when pregnancy safety is UNSAFE without interactions', async () => {
    const rxNormService = {
      resolveRxCuis: jest.fn().mockImplementation(async () => [
        { medicine: 'isotretinoin', normalizedName: 'isotretinoin', rxcui: '72682' }
      ])
    };

    const interactionService = {
      getStructuredInteractions: jest.fn().mockImplementation(async () => ({
        interactionChecked: false,
        interactions: []
      }))
    };

    const legitimacyService = {
      checkMedicineLegitimacy: jest.fn().mockImplementation(async () => ({
        name: 'isotretinoin',
        normalizedName: 'isotretinoin',
        rxcui: '72682',
        compositionMatch: 'EXACT_MATCH',
        sources: { rxnorm: true, fda: true, dailymed: false },
        legitimacyScore: 90,
        legitimacyStatus: 'VERIFIED',
        pregnancySafety: 'UNSAFE',
        notes: []
      }))
    };

    const service = new SafetyEngineService(rxNormService as any, interactionService as any, legitimacyService as any);

    const result = await service.runSafetyCheck({
      medicineEntries: [{ name: 'isotretinoin', composition: ['isotretinoin'] }],
      pregnancyStage: 'first'
    });

    expect(result.risk).toBe('HIGH');
  });
});
