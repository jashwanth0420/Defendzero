import { Queue, Worker } from 'bullmq';
import { redis, isRedisConnected, ENABLE_QUEUE } from '../config/redis';

export class AdherenceQueueService {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private readonly queueName = 'adherence-reminders';

  constructor() {
    if (ENABLE_QUEUE && redis) {
       this.initQueue();
    } else {
       console.log('⚠️ AdherenceQueueService is disabled or Redis is unavailable.');
    }
  }

  private initQueue() {
    try {
      this.queue = new Queue(this.queueName, { connection: redis! });
      
      // Local worker for demo/internal processing
      this.worker = new Worker(this.queueName, async (job) => {
        console.log(`[Queue Runner] Processing reminder: ${job.id}`, job.data);
      }, { connection: redis! });

      this.worker.on('failed', (job, err) => {
        console.error(`❌ Reminder Job ${job?.id} failed with error:`, err.message);
      });

      console.log('✅ BullMQ Adherence Queue initialized successfully.');
    } catch (error) {
      console.warn('⚠️ BullMQ initialization failed:', error);
    }
  }

  /**
   * Schedule a recurring reminder in the queue.
   */
  public async scheduleRecurringReminder(data: any, frequency: string) {
    if (!ENABLE_QUEUE || !this.queue) {
       console.log('ℹ️ Queue is disabled. Skipping schedule enqueue, logging only:', data.medicineName);
       return;
    }

    try {
      await this.queue.add('send-reminder', data, {
        repeat: frequency === 'DAILY' ? { pattern: '0 8 * * *' } : { pattern: '0 8 * * 1' }, // Default cron for demo 8 AM
        removeOnComplete: true,
        removeOnFail: false
      });
      console.log(`✅ Adherence Reminder for [${data.medicineName}] enqueued successfully.`);
    } catch (error) {
      console.error('❌ Failed to add job to BullMQ queue:', error);
    }
  }
}
