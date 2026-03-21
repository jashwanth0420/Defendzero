import { prisma } from '../../config/prisma';
import { AdherenceQueueService } from '../../jobs/adherence.queue';

const adherenceQueueService = new AdherenceQueueService();

export class AdherenceService {
  public async createSchedule(userId: string, data: any) {
    const { medicineId, dosage, frequency, timeOfDay, startDate, endDate, mealRelation } = data;

    // Verify medicine exists
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId }
    });

    if (!medicine) {
      throw new Error('Medicine not found');
    }

    const schedule = await prisma.schedule.create({
      data: {
        patientId: userId,
        medicineId,
        dosage,
        frequency,
        timeOfDay,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        mealRelation,
        status: 'ACTIVE'
      }
    });

    // Get user's FCM token for notifications
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    // Schedule notification in BullMQ
    if (user?.fcmToken) {
      await adherenceQueueService.scheduleRecurringReminder({
        scheduleId: schedule.id,
        patientId: userId,
        medicineName: medicine.name,
        dosage: dosage,
        timeOfDay: timeOfDay,
        mealRelation: mealRelation,
        fcmToken: user.fcmToken
      }, frequency);
    }

    return schedule;
  }

  public async logAdherence(userId: string, scheduleId: string, status: 'TAKEN' | 'MISSED' | 'SKIPPED') {
    // Verify schedule belongs to user
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule || schedule.patientId !== userId) {
      throw new Error('Schedule not found or unauthorized');
    }

    const log = await prisma.adherenceLog.create({
      data: {
        scheduleId,
        patientId: userId,
        status,
        takenAt: status === 'TAKEN' ? new Date() : null
      }
    });

    return log;
  }

  public async getSchedules(userId: string) {
    const schedules = await prisma.schedule.findMany({
      where: { patientId: userId, status: 'ACTIVE' },
      include: { medicine: true }
    });
    
    return schedules;
  }
}
