import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

// If running in test environment, avoid connecting to Redis/BullMQ.
// Provide no-op queues and a healthy check to make unit tests deterministic.
const isTest = process.env.NODE_ENV === 'test' || config.NODE_ENV === 'test';

let redis: IORedis | null = null;
let translationQueue: Queue | null = null;
let emailQueue: Queue | null = null;

if (!isTest) {
  // Real Redis connection
  redis = new IORedis(config.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
  });

  // Queue definitions
  translationQueue = new Queue('translation', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });

  emailQueue = new Queue('email', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
} else {
  // Provide simple in-memory stand-ins for queues in tests to avoid side effects
  logger.info('Running in test mode: queue connections disabled');

  // Minimal stubs implementing add() and close()
  const stubQueue = (name: string) =>
    ({
      name,
      async add(jobName: string, data: any, opts?: any) {
        logger.debug({ jobName, data }, `Stub queue ${name} received job`);
        return { id: `${Date.now()}` } as any;
      },
      async close() {
        logger.debug(`Stub queue ${name} closed`);
      },
    }) as unknown as Queue;

  translationQueue = stubQueue('translation');
  emailQueue = stubQueue('email');
}

// Job types
export interface TranslationJobData {
  urn: string;
  objectId: string;
  fileName: string;
  requestId: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  requestId: string;
}

// Queue health check
export const isQueueHealthy = async (): Promise<boolean> => {
  if (isTest) return true;

  try {
    if (!redis) return false;
    await redis.ping();
    return true;
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Queue health check failed');
    return false;
  }
};

// Graceful shutdown
export const closeQueues = async (): Promise<void> => {
  logger.info('Closing queues...');

  try {
    const ops: Promise<any>[] = [];
    if (translationQueue && typeof (translationQueue as any).close === 'function')
      ops.push((translationQueue as any).close());
    if (emailQueue && typeof (emailQueue as any).close === 'function')
      ops.push((emailQueue as any).close());
    if (redis && typeof redis.disconnect === 'function')
      ops.push(Promise.resolve(redis.disconnect()));

    await Promise.all(ops);
    logger.info('Queues closed');
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Error closing queues');
  }
};

// Job processors (these would be implemented in separate worker processes in production)
export const createTranslationWorker = () => {
  return new Worker<TranslationJobData>(
    'translation',
    async (job: Job<TranslationJobData>) => {
      const { urn, objectId, fileName, requestId } = job.data;
      const jobLogger = logger.child({ requestId, jobId: job.id });

      jobLogger.info({ urn, objectId, fileName }, 'Processing translation job');

      try {
        // This would contain the actual translation logic
        // For now, we'll just simulate processing
        await new Promise((resolve) => setTimeout(resolve, 5000));

        jobLogger.info({ urn }, 'Translation job completed');

        return { success: true, urn };
      } catch (error) {
        jobLogger.error({ error: (error as Error).message }, 'Translation job failed');
        throw error;
      }
    },
    {
      connection: redis as any,
      concurrency: 2,
    },
  );
};

export const createEmailWorker = () => {
  return new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
      const { to, subject, template, data, requestId } = job.data;
      const jobLogger = logger.child({ requestId, jobId: job.id });

      jobLogger.info({ to, subject }, 'Processing email job');

      try {
        // This would contain the actual email sending logic
        // For now, we'll just simulate sending
        await new Promise((resolve) => setTimeout(resolve, 1000));

        jobLogger.info({ to }, 'Email job completed');

        return { success: true };
      } catch (error) {
        jobLogger.error({ error: (error as Error).message }, 'Email job failed');
        throw error;
      }
    },
    {
      connection: redis as any,
      concurrency: 5,
    },
  );
};
