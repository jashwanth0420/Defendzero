import { afterEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { DailyMedClient } from '../../src/clients/dailymed.client';
import { FdaClient } from '../../src/clients/fda.client';
import { RxNavClient } from '../../src/clients/rxnav.client';

describe('POST /api/safety-check', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('valid medicine with correct composition returns VERIFIED', async () => {
    jest.spyOn(RxNavClient.prototype, 'getRxNormInfoByMedicineName').mockResolvedValue({ rxcui: '20610', normalizedName: 'cetirizine' });
    jest.spyOn(RxNavClient.prototype, 'getIngredientsByRxCui').mockResolvedValue(['cetirizine']);
    const interactionSpy = jest.spyOn(RxNavClient.prototype, 'getInteractionsByRxCuis').mockResolvedValue([]);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByName').mockResolvedValue({ id: 'label-1', pregnancy: ['no evidence of risk'] } as any);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByGenericName').mockResolvedValue({ id: 'label-2' } as any);
    jest.spyOn(DailyMedClient.prototype, 'findLabelTextByDrugName').mockResolvedValue(null);

    const response = await request(app).post('/api/safety-check').send({
      medicineEntries: [{ name: 'cetirizine', composition: ['cetirizine'] }],
      pregnancyStage: 'second'
    });

    expect(response.status).toBe(200);
    expect(response.body.legitimacyChecks[0].legitimacyStatus).toBe('VERIFIED');
    expect(response.body.legitimacyChecks[0].compositionMatch).toBe('EXACT_MATCH');
    expect(interactionSpy).not.toHaveBeenCalled();
  });

  it('valid medicine with incorrect composition returns PARTIAL or NOT_VERIFIED', async () => {
    jest.spyOn(RxNavClient.prototype, 'getRxNormInfoByMedicineName').mockResolvedValue({ rxcui: '20610', normalizedName: 'cetirizine' });
    jest.spyOn(RxNavClient.prototype, 'getIngredientsByRxCui').mockResolvedValue(['cetirizine']);
    jest.spyOn(RxNavClient.prototype, 'getInteractionsByRxCuis').mockResolvedValue([]);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByName').mockResolvedValue({ id: 'label-1' } as any);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByGenericName').mockResolvedValue({ id: 'label-2' } as any);
    jest.spyOn(DailyMedClient.prototype, 'findLabelTextByDrugName').mockResolvedValue(null);

    const response = await request(app).post('/api/safety-check').send({
      medicineEntries: [{ name: 'cetirizine', composition: ['ibuprofen'] }],
      pregnancyStage: 'second'
    });

    expect(response.status).toBe(200);
    expect(['PARTIAL', 'NOT_VERIFIED']).toContain(response.body.legitimacyChecks[0].legitimacyStatus);
    expect(response.body.legitimacyChecks[0].compositionMatch).toBe('NO_MATCH');
  });

  it('unknown medicine name stays resilient and low confidence', async () => {
    jest.spyOn(RxNavClient.prototype, 'getRxNormInfoByMedicineName').mockResolvedValue({ rxcui: null, normalizedName: 'randomfake123' });
    jest.spyOn(RxNavClient.prototype, 'getIngredientsByRxCui').mockResolvedValue([]);
    jest.spyOn(RxNavClient.prototype, 'getInteractionsByRxCuis').mockResolvedValue([]);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByName').mockResolvedValue(null);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByGenericName').mockResolvedValue(null);
    jest.spyOn(DailyMedClient.prototype, 'findLabelTextByDrugName').mockResolvedValue(null);

    const response = await request(app).post('/api/safety-check').send({
      medicineEntries: [{ name: 'randomfake123', composition: ['xzyq'] }]
    });

    expect(response.status).toBe(200);
    expect(response.body.rxcuis[0].rxcui).toBeNull();
    expect(response.body.legitimacyChecks[0].legitimacyStatus).toBe('NOT_VERIFIED');
    expect(response.body.meta.rxnormResolved).toBe(0);
    expect(response.body.meta.interactionChecked).toBe(false);
  });

  it('partial ingredient match returns PARTIAL_MATCH', async () => {
    jest.spyOn(RxNavClient.prototype, 'getRxNormInfoByMedicineName').mockResolvedValue({ rxcui: '12345', normalizedName: 'amoxicillin clavulanate' });
    jest.spyOn(RxNavClient.prototype, 'getIngredientsByRxCui').mockResolvedValue(['amoxicillin', 'clavulanate']);
    jest.spyOn(RxNavClient.prototype, 'getInteractionsByRxCuis').mockResolvedValue([]);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByName').mockResolvedValue({ id: 'label-partial' } as any);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByGenericName').mockResolvedValue({ id: 'label-partial-generic' } as any);
    jest.spyOn(DailyMedClient.prototype, 'findLabelTextByDrugName').mockResolvedValue(null);

    const response = await request(app).post('/api/safety-check').send({
      medicineEntries: [{ name: 'Augmentin', composition: ['amoxicillin', 'random-additive'] }],
      pregnancyStage: 'unknown'
    });

    expect(response.status).toBe(200);
    expect(response.body.legitimacyChecks[0].compositionMatch).toBe('PARTIAL_MATCH');
  });

  it('uses DailyMed fallback when FDA fails', async () => {
    jest.spyOn(RxNavClient.prototype, 'getRxNormInfoByMedicineName').mockResolvedValue({ rxcui: '33333', normalizedName: 'sampledrug' });
    jest.spyOn(RxNavClient.prototype, 'getIngredientsByRxCui').mockResolvedValue(['sample ingredient']);
    jest.spyOn(RxNavClient.prototype, 'getInteractionsByRxCuis').mockResolvedValue([]);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByName').mockResolvedValue(null);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByGenericName').mockResolvedValue(null);
    jest.spyOn(DailyMedClient.prototype, 'findLabelTextByDrugName').mockResolvedValue('use with caution during pregnancy');

    const response = await request(app).post('/api/safety-check').send({
      medicineEntries: [{ name: 'sampledrug', composition: ['sample ingredient'] }]
    });

    expect(response.status).toBe(200);
    expect(response.body.legitimacyChecks[0].sources.dailymed).toBe(true);
    expect(response.body.legitimacyChecks[0].pregnancySafety).toBe('CAUTION');
  });

  it('detects pregnancy UNSAFE from label text', async () => {
    jest.spyOn(RxNavClient.prototype, 'getRxNormInfoByMedicineName').mockResolvedValue({ rxcui: '72682', normalizedName: 'isotretinoin' });
    jest.spyOn(RxNavClient.prototype, 'getIngredientsByRxCui').mockResolvedValue(['isotretinoin']);
    jest.spyOn(RxNavClient.prototype, 'getInteractionsByRxCuis').mockResolvedValue([]);
    jest
      .spyOn(FdaClient.prototype, 'findDrugLabelByName')
      .mockResolvedValue({ id: 'unsafe-label', warnings: ['contraindicated in pregnancy due to fetal harm'] } as any);
    jest.spyOn(FdaClient.prototype, 'findDrugLabelByGenericName').mockResolvedValue(null);
    jest.spyOn(DailyMedClient.prototype, 'findLabelTextByDrugName').mockResolvedValue(null);

    const response = await request(app).post('/api/safety-check').send({
      medicineEntries: [{ name: 'isotretinoin', composition: ['isotretinoin'] }],
      pregnancyStage: 'first'
    });

    expect(response.status).toBe(200);
    expect(response.body.legitimacyChecks[0].pregnancySafety).toBe('UNSAFE');
    expect(response.body.risk).toBe('HIGH');
  });
});
