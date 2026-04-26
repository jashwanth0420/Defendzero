import { logger } from '../utils/logger';

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

type ReminderRecord = {
  kind: 'recurring' | 'scheduled' | 'test';
  createdAt: string;
  data: ReminderJobData | TestReminderJobData;
};

const reminderOutbox: ReminderRecord[] = [];

const recordReminder = (kind: ReminderRecord['kind'], data: ReminderRecord['data']): void => {
  reminderOutbox.push({
    kind,
    createdAt: new Date().toISOString(),
    data
  });

  if (reminderOutbox.length > 100) {
    reminderOutbox.shift();
  }
};

export const adherenceQueue = null;

export const getQueuedReminders = (): ReminderRecord[] => [...reminderOutbox];

export class AdherenceQueueService {
  public async scheduleRecurringReminder(data: ReminderJobData, frequency: string): Promise<void> {
    recordReminder('recurring', data);
    logger.info('Reminder scheduling is running in-memory only; recorded recurring reminder request.', {
      queue: ADHERENCE_QUEUE_NAME,
      medicineName: data.medicineName,
      frequency
    });
  }

  public async scheduleMedicationReminderJobs(data: MultiTimeReminderInput): Promise<void> {
    let scheduledCount = 0;
    for (const timeOfDay of data.scheduleTimes) {
      const [hour, minute] = timeOfDay.split(':').map(Number);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        logger.warn('Invalid schedule time ignored', { queue: ADHERENCE_QUEUE_NAME, timeOfDay });
        continue;
      }

      recordReminder('scheduled', {
        scheduleId: data.scheduleId,
        patientId: data.patientId,
        medicineName: data.medicineName,
        dosage: data.dosage,
        mealRelation: data.mealRelation,
        timeOfDay,
        fcmToken: data.fcmToken,
        source: 'medication-dashboard'
      } satisfies ReminderJobData);
      scheduledCount += 1;
    }

    logger.info('Reminder scheduling is running in-memory only; recorded medication reminder request.', {
      queue: ADHERENCE_QUEUE_NAME,
      scheduleId: data.scheduleId,
      scheduledCount,
      frequency: data.frequency
    });
  }
}

export const addDelayedReminderTestJob = async (delayMs = 7000): Promise<void> => {
  const safeDelay = Math.max(0, Math.min(Math.round(delayMs), 10000));
  recordReminder('test', { message: 'Reminder triggered' });
  logger.info('Reminder test job simulated in-memory.', { queue: ADHERENCE_QUEUE_NAME, delayMs: safeDelay });
};
