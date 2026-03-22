import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

const ADHERENCE_QUEUE_NAME = 'adherence';

export interface ReminderJobData {
  scheduleId: string;
  patientId: string;
  medicineName: string;
  dosage: string;
  timeOfDay?: string;
  mealRelation?: string;
  fcmToken?: string;
  source?: 'legacy' | 'medication-dashboard';
}

export interface TestReminderJobData {
  message: string;
}

interface MultiTimeReminderInput {
  scheduleId: string;
  patientId: string;
  medicineName: string;
  dosage: string;
  frequency: 'DAILY' | 'WEEKLY';
  scheduleTimes: string[];
  mealRelation?: string;
  fcmToken?: string;
}

export const adherenceQueue = redisConnection
  ? new Queue<ReminderJobData | TestReminderJobData>(ADHERENCE_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;

if (!adherenceQueue) {
  console.warn('[Queue:adherence] Redis unavailable. Jobs will be skipped.');
}

export class AdherenceQueueService {
  public async scheduleRecurringReminder(data: ReminderJobData, frequency: string): Promise<void> {
    if (!adherenceQueue) {
      console.warn('[Queue:adherence] Skipping recurring reminder because queue is unavailable.');
      return;
    }

    try {
      await adherenceQueue.add('send-reminder', data, {
        repeat: frequency === 'DAILY' ? { pattern: '0 8 * * *' } : { pattern: '0 8 * * 1' },
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
      });
      console.log(`[Queue:adherence] Recurring reminder scheduled for ${data.medicineName}.`);
    } catch (error) {
      console.error('[Queue:adherence] Failed to schedule recurring reminder:', error);
    }
  }

  public async scheduleMedicationReminderJobs(data: MultiTimeReminderInput): Promise<void> {
    if (!adherenceQueue) {
      console.warn('[Queue:adherence] Skipping medication reminders because queue is unavailable.');
      return;
    }

    for (const timeOfDay of data.scheduleTimes) {
      const [hour, minute] = timeOfDay.split(':').map(Number);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        console.warn(`[Queue:adherence] Invalid schedule time ignored: ${timeOfDay}`);
        continue;
      }

      const pattern = data.frequency === 'DAILY' ? `${minute} ${hour} * * *` : `${minute} ${hour} * * 1`;

      try {
        await adherenceQueue.add(
          'send-reminder',
          {
            scheduleId: data.scheduleId,
            patientId: data.patientId,
            medicineName: data.medicineName,
            dosage: data.dosage,
            mealRelation: data.mealRelation,
            timeOfDay,
            fcmToken: data.fcmToken,
            source: 'medication-dashboard',
          } satisfies ReminderJobData,
          {
            repeat: { pattern },
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
          }
        );
      } catch (error) {
        console.error('[Queue:adherence] Failed to add medication reminder job:', error);
      }
    }
  }
}

export const addDelayedReminderTestJob = async (delayMs = 7000): Promise<void> => {
  if (!adherenceQueue) {
    console.warn('[Queue:adherence] Cannot enqueue test job because queue is unavailable.');
    return;
  }

  const safeDelay = Math.max(5000, Math.min(delayMs, 10000));

  try {
    await adherenceQueue.add(
      'test-reminder',
      { message: 'Reminder triggered' },
      {
        delay: safeDelay,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    console.log(`[Queue:adherence] Test reminder job queued with ${safeDelay}ms delay.`);
  } catch (error) {
    console.error('[Queue:adherence] Failed to queue test reminder job:', error);
  }
};
