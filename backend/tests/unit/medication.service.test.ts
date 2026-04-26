import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockPrisma = {
  medicationSchedule: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  medicationLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  purchaseToken: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  medicine: {
    upsert: jest.fn(),
  },
  purchaseLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
};

jest.mock('../../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../src/queues/adherence.queue', () => ({
  AdherenceQueueService: class {
    scheduleMedicationReminderJobs = jest.fn(async () => undefined);
  },
}));

import { MedicationService } from '../../src/modules/medication/medication.service';

describe('MedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes adherence history and missed streak', async () => {
    mockPrisma.medicationLog.findMany.mockImplementation(async () => [
      { date: new Date('2026-03-20'), status: 'TAKEN' },
      { date: new Date('2026-03-20'), status: 'MISSED' },
      { date: new Date('2026-03-21'), status: 'MISSED' },
      { date: new Date('2026-03-22'), status: 'MISSED' },
    ]);

    const service = new MedicationService();
    const result = await service.getHistory('user-1');

    expect(result.totalTaken).toBe(1);
    expect(result.totalMissed).toBe(3);
    expect(result.adherencePercent).toBe(25);
    expect(result.currentMissedStreak).toBe(2);
  });

  it('rejects purchase when token is expired', async () => {
    mockPrisma.purchaseToken.findUnique.mockImplementation(async () => ({
      id: 'token-1',
      userId: 'user-1',
      maxQuantity: 10,
      usedQuantity: 0,
      expiryDate: new Date('2020-01-01')
    }));

    const service = new MedicationService();

    await expect(service.validatePurchase('user-1', 'raw-token', 'paracetamol', 1)).rejects.toThrow('Token expired');
  });

  it('prevents over-purchase when quantity exceeds allowance', async () => {
    mockPrisma.purchaseToken.findUnique.mockImplementation(async () => ({
      id: 'token-2',
      userId: 'user-1',
      maxQuantity: 5,
      usedQuantity: 4,
      expiryDate: new Date('2030-01-01')
    }));

    const service = new MedicationService();

    await expect(service.validatePurchase('user-1', 'raw-token', 'paracetamol', 2)).rejects.toThrow(
      'Over-purchase prevented by token limits'
    );
  });
});
