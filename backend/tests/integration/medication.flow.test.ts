import { describe, expect, it, jest } from '@jest/globals';

const mockPrisma = {
  medicationSchedule: {
    create: jest.fn(async (args: any) => ({ id: 'ms-1', ...args.data })),
    findFirst: jest.fn(async () => ({ id: 'ms-1', userId: 'user-1', medicineName: 'Paracetamol' })),
  },
  schedule: {
    create: jest.fn(async (args: any) => ({ id: 'legacy-s-1', ...args.data })),
  },
  medicationLog: {
    create: jest.fn(async (args: any) => ({ id: 'ml-1', ...args.data })),
    findMany: jest.fn(async () => []),
  },
  prescriptionRecord: {
    create: jest.fn(async (args: any) => ({ id: 'pr-1', ...args.data })),
    findFirst: jest.fn(async () => ({ id: 'pr-1', userId: 'user-1', verified: true, medicines: [{ name: 'Paracetamol' }] })),
    update: jest.fn(async (args: any) => ({ id: args.where.id, ...args.data })),
  },
  purchaseToken: {
    create: jest.fn(async (args: any) => ({ id: 'pt-1', usedQuantity: 0, ...args.data })),
    findUnique: jest.fn(async () => ({ id: 'pt-1', userId: 'user-1', maxQuantity: 10, usedQuantity: 0, expiryDate: new Date('2030-01-01') })),
    update: jest.fn(async (args: any) => ({ id: 'pt-1', maxQuantity: 10, usedQuantity: 1, expiryDate: new Date('2030-01-01'), ...args.data })),
  },
  medicine: {
    upsert: jest.fn(async () => ({ id: 'med-1', name: 'Paracetamol' })),
  },
  purchaseLog: {
    create: jest.fn(async (args: any) => ({ id: 'p-1', ...args.data })),
  },
  user: {
    findUnique: jest.fn(async () => ({ fcmToken: 'token' })),
  },
  notification: {
    create: jest.fn(async (args: any) => ({ id: 'n-1', ...args.data })),
  },
  $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
};

jest.mock('../../src/config/prisma', () => ({ prisma: mockPrisma }));

jest.mock('../../src/queues/adherence.queue', () => ({
  AdherenceQueueService: class {
    scheduleMedicationReminderJobs = jest.fn(async () => undefined);
  },
}));

import { MedicationService } from '../../src/modules/medication/medication.service';

describe('Medication Flow Integration', () => {
  it('supports schedule -> log flow', async () => {
    const service = new MedicationService();

    const schedule = await service.createSchedule('user-1', {
      medicineName: 'Paracetamol',
      composition: ['Acetaminophen'],
      dosage: '500mg',
      frequency: 'DAILY' as any,
      timingType: 'WITH_FOOD' as any,
      scheduleTimes: ['08:00'],
      startDate: new Date().toISOString(),
    });

    const log = await service.logDose('user-1', schedule.id, 'TAKEN' as any);

    expect(schedule.medicineName).toBe('Paracetamol');
    expect(log.status).toBe('TAKEN');
  });

  it('supports prescription -> token -> purchase flow', async () => {
    const service = new MedicationService();

    const prescription = await service.uploadPrescription('user-1', {
      medicines: [{ name: 'Paracetamol' }],
      doctorName: 'Dr. Test',
    });

    await service.confirmPrescription('user-1', prescription.id, [{ name: 'Paracetamol' }]);

    const generated = await service.generatePurchaseToken('user-1', prescription.id, 10, 30);
    const purchase = await service.validatePurchase('user-1', generated.token, 'Paracetamol', 1);

    expect(generated.maxQuantity).toBe(10);
    expect(purchase.success).toBe(true);
  });
});
