import { afterEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { RxNavClient } from '../../src/clients/rxnav.client';

describe('GET /api/medicine/search', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns simplified rxnorm search results', async () => {
    jest.spyOn(RxNavClient.prototype, 'searchDrugsByName').mockResolvedValue([
      { rxcui: '161', name: 'Tylenol', synonym: 'Acetaminophen', tty: 'BN' },
      { rxcui: '198', name: 'Acetaminophen', synonym: 'Acetaminophen', tty: 'IN' }
    ] as any);

    const response = await request(app).get('/api/medicine/search?q=paracetamol');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { name: 'Tylenol', generic_name: 'Acetaminophen', brand_name: 'Tylenol' },
      { name: 'Acetaminophen', generic_name: 'Acetaminophen', brand_name: '' }
    ]);
  });

  it('returns 400 when q is missing', async () => {
    const response = await request(app).get('/api/medicine/search');
    expect(response.status).toBe(400);
  });
});
