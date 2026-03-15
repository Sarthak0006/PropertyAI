import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

const connection = {
  host: redisClient.options.host || 'localhost',
  port: redisClient.options.port || 6379,
};

export const indexingQueue = new Queue('indexing', { connection });
export const analyticsQueue = new Queue('analytics', { connection });
export const embeddingQueue = new Queue('embedding', { connection });

export class QueueService {
  async addIndexingJob(data: any): Promise<void> {
    try {
      await indexingQueue.add('index-property', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to add indexing job');
    }
  }

  async addAnalyticsJob(data: any): Promise<void> {
    try {
      await analyticsQueue.add('track-search', data, {
        attempts: 2,
        removeOnComplete: 100,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to add analytics job');
    }
  }

  async addEmbeddingJob(data: any): Promise<void> {
    try {
      await embeddingQueue.add('generate-embedding', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to add embedding job');
    }
  }
}
