import { Job, Worker } from 'bullmq';
import { firebaseAdmin } from '../config/firebase.config';
import { prisma } from '../config/prisma';
import { redisConnection } from '../config/redis';
import { ReminderJobData, TestReminderJobData } from '../queues/adherence.queue';

type AdherenceJobData = ReminderJobData | TestReminderJobData;

const ADHERENCE_QUEUE_NAME = 'adherence';

const formatMealRelation = (relation?: string): string => {
  if (relation === 'BEFORE_MEAL') return ' (Take 30 mins before eating)';
  if (relation === 'WITH_MEAL') return ' (Take with food)';
  if (relation === 'AFTER_MEAL') return ' (Take 1 hr after eating)';
  return '';
};

const isTestReminderJob = (job: Job<AdherenceJobData>): job is Job<TestReminderJobData> => {
  return job.name === 'test-reminder';
};

const processAdherenceJob = async (job: Job<AdherenceJobData>): Promise<void> => {
  try {
    if (isTestReminderJob(job)) {
      console.log(`[Worker:adherence] ${job.data.message}`);
      return;
    }

    const { scheduleId, patientId, medicineName, dosage, mealRelation, fcmToken } = job.data as ReminderJobData;
    const mealWarning = formatMealRelation(mealRelation);

    console.log(`[Worker:adherence] Processing job ${job.id} for medicine ${medicineName}.`);

    const patient = await prisma.user.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Patient not found for reminder job.');
    }

    const message = {
      notification: {
        title: 'Medicine Reminder',
        body: `Hi ${patient.firstName}, it is time to take ${dosage} of ${medicineName}.${mealWarning}`,
      },
      data: {
        scheduleId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    };

    if (fcmToken && process.env.NODE_ENV !== 'test') {
      const response = await firebaseAdmin.messaging().send({
        ...message,
        token: fcmToken,
      });
      console.log(`[Worker:adherence] FCM notification sent: ${response}`);
    } else {
      console.log(`[Worker:adherence] Mock dispatch: ${message.notification.body}`);
    }

    await prisma.notification.create({
      data: {
        userId: patientId,
        type: 'REMINDER',
        title: message.notification.title,
        body: message.notification.body,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown adherence worker error');
    console.error(`[Worker:adherence] Job ${job.id} failed: ${err.message}`);
    throw err;
  }
};

let adherenceWorker: Worker<AdherenceJobData> | null = null;

export const startAdherenceWorker = (): Worker<AdherenceJobData> | null => {
  if (adherenceWorker) {
    return adherenceWorker;
  }

  if (!redisConnection) {
    console.warn('[Worker:adherence] REDIS_URL missing. Worker not started.');
    return null;
  }

  try {
    adherenceWorker = new Worker<AdherenceJobData>(ADHERENCE_QUEUE_NAME, processAdherenceJob, {
      connection: redisConnection,
      concurrency: 5,
    });

    adherenceWorker.on('completed', (job) => {
      console.log(`[Worker:adherence] Completed job ${job.id} (${job.name}).`);
    });

    adherenceWorker.on('failed', (job, error) => {
      console.error(
        `[Worker:adherence] Failed job ${job?.id ?? 'unknown'} (${job?.name ?? 'unknown'}): ${error.message}`
      );
    });

    adherenceWorker.on('error', (error) => {
      console.error('[Worker:adherence] Worker error:', error.message);
    });

    console.log('[Worker:adherence] Worker started.');
    return adherenceWorker;
  } catch (error) {
    console.error('[Worker:adherence] Startup failed:', error);
    adherenceWorker = null;
    return null;
  }
};

export const getAdherenceWorker = (): Worker<AdherenceJobData> | null => adherenceWorker;

if (require.main === module) {
  startAdherenceWorker();
}
