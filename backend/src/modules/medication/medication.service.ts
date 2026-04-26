import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AdherenceQueueService } from '../../queues/adherence.queue';

const adherenceQueueService = new AdherenceQueueService();

type CreateScheduleInput = {
  medicineName: string;
  composition: string[];
  dosage: string;
  frequency: 'DAILY' | 'WEEKLY';
  timingType: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD';
  scheduleTimes: string[];
  startDate: string;
  endDate?: string;
};

export class MedicationService {
  private readonly db = prisma as any;

  private toInputJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  public async createSchedule(userId: string, input: CreateScheduleInput) {
    const mealRelation = this.toMealRelation(input.timingType);

    const schedule = await this.db.$transaction(async (tx: any) => {
      const created = await tx.medicationSchedule.create({
        data: {
          userId,
          medicineName: input.medicineName,
          composition: input.composition,
          dosage: input.dosage,
          frequency: input.frequency,
          timingType: input.timingType,
          scheduleTimes: input.scheduleTimes,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null
        }
      });

      const medicine = await tx.medicine.upsert({
        where: { name: input.medicineName },
        update: {},
        create: { name: input.medicineName }
      });

      for (const time of input.scheduleTimes) {
        await tx.schedule.create({
          data: {
            patientId: userId,
            medicineId: medicine.id,
            dosage: input.dosage,
            frequency: input.frequency,
            timeOfDay: time,
            startDate: new Date(input.startDate),
            endDate: input.endDate ? new Date(input.endDate) : null,
            mealRelation,
            status: 'ACTIVE'
          }
        });
      }

      return created;
    });

    const user = await this.db.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });

    await adherenceQueueService.scheduleMedicationReminderJobs({
      scheduleId: schedule.id,
      patientId: userId,
      medicineName: input.medicineName,
      dosage: input.dosage,
      mealRelation,
      frequency: input.frequency,
      scheduleTimes: input.scheduleTimes,
      fcmToken: user?.fcmToken || undefined
    });

    return schedule;
  }

  public async getSchedules(userId: string) {
    return this.db.medicationSchedule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async logDose(userId: string, scheduleId: string, status: 'TAKEN' | 'MISSED', date?: string) {
    const schedule = await this.db.medicationSchedule.findFirst({ where: { id: scheduleId, userId } });
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const logDate = date ? new Date(date) : new Date();
    const normalizedDate = new Date(logDate);
    normalizedDate.setHours(0, 0, 0, 0);

    const log = await this.db.medicationLog.create({
      data: {
        scheduleId,
        userId,
        date: normalizedDate,
        status,
        timestamp: new Date()
      }
    });

    if (status === 'MISSED') {
      await this.db.notification.create({
        data: {
          userId,
          type: 'MISSED_DOSE',
          title: 'Dose missed',
          body: `You missed ${schedule.medicineName}. Please review your schedule.`
        }
      });
    }

    return log;
  }

  public async getLogs(userId: string, date?: string) {
    const where: any = { userId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }

    return this.db.medicationLog.findMany({
      where,
      include: { schedule: true },
      orderBy: { timestamp: 'desc' }
    });
  }

  public async getHistory(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs: Array<{ date: Date; status: string }> = await this.db.medicationLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' }
    });

    const byDate = new Map<string, { taken: number; missed: number }>();

    for (const log of logs) {
      const key = log.date.toISOString().slice(0, 10);
      const current = byDate.get(key) || { taken: 0, missed: 0 };
      if (log.status === 'TAKEN') {
        current.taken += 1;
      } else if (log.status === 'MISSED') {
        current.missed += 1;
      }
      byDate.set(key, current);
    }

    let missedStreak = 0;
    const timeline = Array.from(byDate.entries()).map(([date, value]) => {
      const total = value.taken + value.missed;
      const adherencePercent = total === 0 ? 0 : Math.round((value.taken / total) * 100);
      if (value.missed > 0 && value.taken === 0) {
        missedStreak += 1;
      } else {
        missedStreak = 0;
      }
      return {
        date,
        taken: value.taken,
        missed: value.missed,
        adherencePercent,
        missedStreak
      };
    });

    const totalTaken = logs.filter((l) => l.status === 'TAKEN').length;
    const totalMissed = logs.filter((l) => l.status === 'MISSED').length;
    const total = totalTaken + totalMissed;

    return {
      adherencePercent: total === 0 ? 0 : Math.round((totalTaken / total) * 100),
      totalTaken,
      totalMissed,
      currentMissedStreak: timeline.length ? timeline[timeline.length - 1].missedStreak : 0,
      timeline
    };
  }

  public async uploadPrescription(userId: string, payload: { fileUrl?: string; extractedText?: string; medicines: unknown[]; doctorName?: string; issuedDate?: string; }) {
    return this.db.prescriptionRecord.create({
      data: {
        userId,
        medicines: this.toInputJson(payload.medicines),
        doctorName: payload.doctorName,
        issuedDate: payload.issuedDate ? new Date(payload.issuedDate) : new Date(),
        fileUrl: payload.fileUrl,
        extractedText: payload.extractedText,
        verified: false
      }
    });
  }

  public async getPrescriptions(userId: string) {
    return this.db.prescriptionRecord.findMany({
      where: { userId },
      orderBy: { issuedDate: 'desc' }
    });
  }

  public async confirmPrescription(userId: string, prescriptionId: string, medicines: unknown[]) {
    const record = await this.db.prescriptionRecord.findFirst({ where: { id: prescriptionId, userId } });
    if (!record) {
      throw new Error('Prescription not found');
    }

    return this.db.prescriptionRecord.update({
      where: { id: prescriptionId },
      data: {
        medicines: this.toInputJson(medicines),
        verified: true
      }
    });
  }

  public async generatePurchaseToken(userId: string, prescriptionId: string, maxQuantity: number, expiryDays: number) {
    const prescription = await this.db.prescriptionRecord.findFirst({ where: { id: prescriptionId, userId, verified: true } });
    if (!prescription) {
      throw new Error('Verified prescription not found');
    }

    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const token = await this.db.purchaseToken.create({
      data: {
        userId,
        prescriptionId,
        medicines: this.toInputJson(prescription.medicines ?? []),
        maxQuantity,
        expiryDate,
        tokenHash
      }
    });

    return {
      id: token.id,
      token: rawToken,
      expiryDate: token.expiryDate,
      maxQuantity: token.maxQuantity,
      usedQuantity: token.usedQuantity
    };
  }

  public async getTokenDetails(rawToken: string) {
    const normalized = rawToken.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(normalized).digest('hex');
    const token = await this.db.purchaseToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    if (!token) throw new Error('Invalid token');
    if (token.expiryDate < new Date()) throw new Error('Token expired');

    return {
      id: token.id,
      patientName: `${token.user.firstName} ${token.user.lastName}`,
      medicines: token.medicines,
      maxQuantity: token.maxQuantity,
      usedQuantity: token.usedQuantity,
      expiryDate: token.expiryDate
    };
  }

  public async validatePurchase(userId: string, rawToken: string, medicineName: string, quantity: number) {
    const normalized = rawToken.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(normalized).digest('hex');
    const token = await this.db.purchaseToken.findUnique({ where: { tokenHash } });

    if (!token) {
      throw new Error('Invalid token');
    }
    
    // In actual production, we might allow pharmacy to fulfill for any patient if the token is valid.
    // However, the current logic checks userId. Let's keep it for now but maybe the user meant pharmacyId?
    // In v1Routes, pharmacy uses /pharmacy prefix.
    
    if (token.expiryDate < new Date()) {
      throw new Error('Token expired');
    }

    if (token.usedQuantity + quantity > token.maxQuantity) {
      throw new Error('Over-purchase prevented by token limits');
    }

    const medicine = await this.db.medicine.upsert({
      where: { name: medicineName },
      update: {},
      create: { name: medicineName }
    });

    const updatedToken = await this.db.$transaction(async (tx: any) => {
      await tx.purchaseLog.create({
        data: {
          patientId: token.userId,
          medicineId: medicine.id,
          pharmacyId: userId, // Current logged-in user (pharmacy)
          quantity
        }
      });

      return tx.purchaseToken.update({
        where: { id: token.id },
        data: { usedQuantity: { increment: quantity } }
      });
    });

    return {
      success: true,
      remainingQuantity: updatedToken.maxQuantity - updatedToken.usedQuantity,
      expiryDate: updatedToken.expiryDate,
      medicines: updatedToken.medicines
    };
  }

  public async getPurchases(userId: string) {
    return this.db.purchaseLog.findMany({
      where: { patientId: userId },
      include: { medicine: true },
      orderBy: { purchasedAt: 'desc' }
    });
  }

  public async getNotifications(userId: string) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async markNotificationRead(userId: string, notificationId: string) {
    const notification = await this.db.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.db.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
  }

  private toMealRelation(timingType: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD'): string {
    if (timingType === 'BEFORE_FOOD') return 'BEFORE_MEAL';
    if (timingType === 'AFTER_FOOD') return 'AFTER_MEAL';
    return 'WITH_MEAL';
  }
}
