import { redisClient } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { cacheHitRate, cacheMissRate } from '../utils/metrics';

export class RedisRepository {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (data) {
        cacheHitRate.labels('redis').inc();
        return JSON.parse(data) as T;
      }
      cacheMissRate.labels('redis').inc();
      return null;
    } catch (error) {
      logger.error({ error, key }, 'Redis get error');
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      logger.error({ error, key }, 'Redis set error');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Redis del error');
    }
  }

  async addToSearchHistory(query: string): Promise<void> {
    try {
      await redisClient.lpush('search:history', query);
      await redisClient.ltrim('search:history', 0, 99); // Keep last 100
    } catch (error) {
      logger.error({ error }, 'Redis search history error');
    }
  }

  async getSearchHistory(count: number = 10): Promise<string[]> {
    try {
      return await redisClient.lrange('search:history', 0, count - 1);
    } catch (error) {
      logger.error({ error }, 'Redis get history error');
      return [];
    }
  }

  async incrementQueryCount(query: string): Promise<void> {
    try {
      await redisClient.zincrby('search:popular', 1, query);
    } catch (error) {
      logger.error({ error }, 'Redis increment query error');
    }
  }

  async getPopularQueries(count: number = 10): Promise<string[]> {
    try {
      return await redisClient.zrevrange('search:popular', 0, count - 1);
    } catch (error) {
      logger.error({ error }, 'Redis popular queries error');
      return [];
    }
  }
}
