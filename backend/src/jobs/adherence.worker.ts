import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis.client';
import { prisma } from '../config/prisma';
import { firebaseAdmin } from '../config/firebase.config';
import { ReminderJobData } from './adherence.queue';

// Formatting the Meal Relation cleanly into the notification payload
const formatMealRelation = (relation?: string): string => {
  if (relation === 'BEFORE_MEAL') return ' (Take 30 mins before eating)';
  if (relation === 'WITH_MEAL') return ' (Take with food)';
  if (relation === 'AFTER_MEAL') return ' (Take 1 hr after eating)';
  return '';
};

// Start the worker observing the "adherence-queue" via Redis
export const adherenceWorker = new Worker<ReminderJobData>('adherence-queue', async (job: Job) => {
  const { scheduleId, patientId, medicineName, dosage, mealRelation, fcmToken } = job.data;
  const mealWarning = formatMealRelation(mealRelation);

  console.log(`[Worker Processing] Job: ${job.id} | Med: ${medicineName}`);

  try {
    const patient = await prisma.user.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error('Patient deleted or not found.');

    // Construct Firebase Messaging Data
    const message = {
      notification: {
        title: 'Medicine Reminder 💊',
        body: `Hi ${patient.firstName}, it's time to take ${dosage} of ${medicineName}.${mealWarning}`,
      },
      data: {
        scheduleId: scheduleId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // Adjust for specific frontend framework
      },
      token: fcmToken
    };

    // Skip sending if we are missing FCM Token explicitly or mock mapping in Test
    if (fcmToken && process.env.NODE_ENV !== 'test') {
       // Send the notification utilizing FCM Admin SDK
       const response = await firebaseAdmin.messaging().send(message);
       console.log(`[Firebase Dispatch Success] Message ID: ${response}`);
    } else {
       console.log(`[MOCK Mode] Simulated Dispatch: "${message.notification.body}"`);
    }

    // IMPORTANT: 
    // Do NOT mark "Taken" here automatically! 
    // The patient must explicitly call our Adherence API to verify action.

  } catch (err: any) {
    if (err.errorInfo?.code === 'messaging/registration-token-not-registered') {
        console.warn(`[Firebase Cleanup] Removing stale FCM token for Patient: ${patientId}`);
        // Optionally update Patient object here to wipe stale FCM token
    } else {
      console.error(`[Worker Failed] Job ${job.id}: ${err.message}`);
      throw err; // Trigger BullMQ retry backoff policies explicitly
    }
  }

}, { connection: redis });

adherenceWorker.on('completed', job => {
  console.log(`[Worker Completed] Notification processed perfectly for Schedule: ${job.data.scheduleId}`);
});

adherenceWorker.on('failed', (job, err) => {
  console.error(`[Worker Alert] Job repeatedly failing: ${err.message}`);
});
