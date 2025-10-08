/**
 * Queue Management System with BullMQ
 * Production-grade job queue with Redis backend, retry logic, and monitoring
 * Production Hardening - Phase 2
 */

import { Queue, Worker, Job, QueueEvents, ConnectionOptions } from 'bullmq';
import { config } from './env.js';
import { getRedisClient } from './redis.js';
import { logger } from './logger.js';

// Job types with type safety
export interface JobTypes {
  'file-upload': {
    fileId: string;
    originalName: string;
    mimeType: string;
    size: number;
    userId?: string;
  };
  'file-processing': {
    fileId: string;
    processingType: 'resize' | 'convert' | 'compress' | 'scan';
    options: Record<string, any>;
  };
  'email-send': {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
  };
  'notification-push': {
    userId: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    metadata?: Record<string, any>;
  };
  'data-sync': {
    syncType: 'full' | 'incremental';
    entityId?: string;
    timestamp: number;
  };
  'cleanup-temp': {
    olderThan: number;
    directory: string;
  };
  'backup-create': {
    backupType: 'database' | 'files' | 'full';
    compression: boolean;
    retention?: number;
  };
}

// Queue configuration
export interface QueueConfig {
  name: string;
  defaultJobOptions?: {
    removeOnComplete?: number;
    removeOnFail?: number;
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    delay?: number;
  };
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

// Default queue configurations
const queueConfigs: Record<keyof JobTypes, QueueConfig> = {
  'file-upload': {
    name: 'file-upload',
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60000, // 1 minute
    },
  },
  'file-processing': {
    name: 'file-processing',
    defaultJobOptions: {
      removeOnComplete: 25,
      removeOnFail: 50,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
    concurrency: 3,
  },
  'email-send': {
    name: 'email-send',
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 60000,
    },
  },
  'notification-push': {
    name: 'notification-push',
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 1000,
      },
    },
    concurrency: 20,
  },
  'data-sync': {
    name: 'data-sync',
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 25,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    },
    concurrency: 1, // Sequential processing
  },
  'cleanup-temp': {
    name: 'cleanup-temp',
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 10,
      attempts: 1,
    },
    concurrency: 1,
  },
  'backup-create': {
    name: 'backup-create',
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 10,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 30000,
      },
    },
    concurrency: 1,
  },
};

// Job processor type
export type JobProcessor<T extends keyof JobTypes> = (
  job: Job<JobTypes[T]>
) => Promise<any>;

// Queue manager class
export class QueueManager {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private queueEvents = new Map<string, QueueEvents>();
  private connection: ConnectionOptions;
  private isShuttingDown = false;

  constructor() {
    const redisClient = getRedisClient();
    
    this.connection = {
      host: new URL(config.redis.url).hostname,
      port: parseInt(new URL(config.redis.url).port) || 6379,
      db: config.redis.db,
      password: config.redis.password,
      maxRetriesPerRequest: null, // BullMQ handles retries
    };
  }

  // Initialize queue
  private createQueue<T extends keyof JobTypes>(queueName: T): Queue<JobTypes[T]> {
    const queueConfig = queueConfigs[queueName];
    
    const queue = new Queue<JobTypes[T]>(queueConfig.name, {
      connection: this.connection,
      defaultJobOptions: queueConfig.defaultJobOptions,
    });

    // Set up queue events
    const queueEvents = new QueueEvents(queueConfig.name, {
      connection: this.connection,
    });

    // Event listeners
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info(`✅ Job completed`, {
        queue: queueConfig.name,
        jobId,
        returnvalue,
      });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`❌ Job failed`, {
        queue: queueConfig.name,
        jobId,
        failedReason,
      });
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`📊 Job progress`, {
        queue: queueConfig.name,
        jobId,
        progress: data,
      });
    });

    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn(`⏸️ Job stalled`, {
        queue: queueConfig.name,
        jobId,
      });
    });

    // Store references
    this.queues.set(queueName, queue);
    this.queueEvents.set(queueName, queueEvents);

    logger.info(`🚀 Queue initialized`, {
      name: queueConfig.name,
      concurrency: queueConfig.concurrency,
    });

    return queue;
  }

  // Create worker for queue
  private createWorker<T extends keyof JobTypes>(
    queueName: T,
    processor: JobProcessor<T>
  ): Worker<JobTypes[T]> {
    const queueConfig = queueConfigs[queueName];
    
    const worker = new Worker<JobTypes[T]>(
      queueConfig.name,
      async (job) => {
        try {
          logger.info(`🔄 Processing job`, {
            queue: queueConfig.name,
            jobId: job.id,
            data: job.data,
          });

          const result = await processor(job);
          
          logger.info(`✅ Job processed successfully`, {
            queue: queueConfig.name,
            jobId: job.id,
            result,
          });

          return result;
        } catch (error) {
          logger.error(`❌ Job processing failed`, {
            queue: queueConfig.name,
            jobId: job.id,
            error: error.message,
            stack: error.stack,
          });
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: queueConfig.concurrency || 1,
        limiter: queueConfig.limiter,
      }
    );

    // Worker event listeners
    worker.on('completed', (job, result) => {
      logger.debug(`🎉 Worker completed job`, {
        queue: queueConfig.name,
        jobId: job.id,
        duration: Date.now() - job.processedOn!,
      });
    });

    worker.on('failed', (job, err) => {
      logger.error(`💥 Worker failed job`, {
        queue: queueConfig.name,
        jobId: job?.id,
        attempts: job?.attemptsMade,
        error: err.message,
      });
    });

    worker.on('error', (err) => {
      logger.error(`🚨 Worker error`, {
        queue: queueConfig.name,
        error: err.message,
      });
    });

    worker.on('stalled', (jobId) => {
      logger.warn(`⏸️ Worker job stalled`, {
        queue: queueConfig.name,
        jobId,
      });
    });

    this.workers.set(queueName, worker);
    
    logger.info(`👷 Worker created`, {
      queue: queueConfig.name,
      concurrency: queueConfig.concurrency,
    });

    return worker;
  }

  // Add job to queue
  async addJob<T extends keyof JobTypes>(
    queueName: T,
    data: JobTypes[T],
    options: {
      priority?: number;
      delay?: number;
      attempts?: number;
      removeOnComplete?: number;
      removeOnFail?: number;
      jobId?: string;
    } = {}
  ): Promise<Job<JobTypes[T]>> {
    let queue = this.queues.get(queueName);
    
    if (!queue) {
      queue = this.createQueue(queueName);
    }

    const job = await queue.add(queueName, data, options);
    
    logger.info(`📝 Job added to queue`, {
      queue: queueName,
      jobId: job.id,
      data,
      options,
    });

    return job;
  }

  // Register job processor
  registerProcessor<T extends keyof JobTypes>(
    queueName: T,
    processor: JobProcessor<T>
  ): void {
    // Ensure queue exists
    if (!this.queues.has(queueName)) {
      this.createQueue(queueName);
    }

    // Create worker
    this.createWorker(queueName, processor);
    
    logger.info(`🔧 Processor registered`, { queue: queueName });
  }

  // Get queue statistics
  async getQueueStats(queueName: keyof JobTypes): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
      queue.getPaused(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: paused.length,
    };
  }

  // Get all queue statistics
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const queueName of this.queues.keys()) {
      try {
        stats[queueName] = await this.getQueueStats(queueName as keyof JobTypes);
      } catch (error) {
        stats[queueName] = { error: error.message };
      }
    }

    return stats;
  }

  // Pause/Resume queue
  async pauseQueue(queueName: keyof JobTypes): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      logger.info(`⏸️ Queue paused`, { queue: queueName });
    }
  }

  async resumeQueue(queueName: keyof JobTypes): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      logger.info(`▶️ Queue resumed`, { queue: queueName });
    }
  }

  // Clean queues
  async cleanQueue(
    queueName: keyof JobTypes,
    options: {
      grace?: number;
      status?: 'completed' | 'failed' | 'active' | 'waiting';
      limit?: number;
    } = {}
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.clean(options.grace || 0, options.limit || 100, options.status);
      logger.info(`🧹 Queue cleaned`, { queue: queueName, options });
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    queues: Record<string, any>;
    workers: Record<string, any>;
  }> {
    try {
      const queueStats = await this.getAllQueueStats();
      
      const workerStats: Record<string, any> = {};
      for (const [name, worker] of this.workers.entries()) {
        workerStats[name] = {
          isRunning: worker.isRunning(),
          isPaused: worker.isPaused(),
        };
      }

      return {
        status: 'healthy',
        queues: queueStats,
        workers: workerStats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        queues: {},
        workers: {},
      };
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('🛑 Shutting down queue manager...');

    // Close workers
    const workerPromises = Array.from(this.workers.values()).map(worker => 
      worker.close()
    );

    // Close queue events
    const eventPromises = Array.from(this.queueEvents.values()).map(events => 
      events.close()
    );

    // Close queues
    const queuePromises = Array.from(this.queues.values()).map(queue => 
      queue.close()
    );

    await Promise.all([...workerPromises, ...eventPromises, ...queuePromises]);
    
    // Clear maps
    this.workers.clear();
    this.queueEvents.clear();
    this.queues.clear();

    logger.info('✅ Queue manager shutdown complete');
  }
}

// Singleton instance
let queueManager: QueueManager | null = null;

export function createQueueManager(): QueueManager {
  if (!queueManager) {
    queueManager = new QueueManager();
  }
  return queueManager;
}

export function getQueueManager(): QueueManager {
  if (!queueManager) {
    throw new Error('Queue manager not initialized. Call createQueueManager() first.');
  }
  return queueManager;
}

export async function shutdownQueueManager(): Promise<void> {
  if (queueManager) {
    await queueManager.shutdown();
    queueManager = null;
  }
}

// Default export
export default {
  createQueueManager,
  getQueueManager,
  shutdownQueueManager,
};