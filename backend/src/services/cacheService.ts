import { RedisRepository } from '../repositories/redisRepository';
import { config } from '../config';

export class CacheService {
  constructor(private readonly redis: RedisRepository) {}

  async getSearchResults<T>(cacheKey: string): Promise<T | null> {
    return this.redis.get<T>(cacheKey);
  }

  async setSearchResults(cacheKey: string, data: any): Promise<void> {
    await this.redis.set(cacheKey, data, config.cache.searchTTL);
  }

  async getProperty<T>(id: number): Promise<T | null> {
    return this.redis.get<T>(`property:${id}`);
  }

  async setProperty(id: number, data: any): Promise<void> {
    await this.redis.set(`property:${id}`, data, config.cache.propertyTTL);
  }

  async getSuggestions(prefix: string): Promise<string[] | null> {
    return this.redis.get<string[]>(`suggest:${prefix}`);
  }

  async setSuggestions(prefix: string, data: string[]): Promise<void> {
    await this.redis.set(`suggest:${prefix}`, data, config.cache.suggestionTTL);
  }

  buildSearchCacheKey(params: Record<string, any>): string {
    const sorted = Object.keys(params).sort().reduce((acc: any, key) => {
      if (params[key] !== undefined && params[key] !== '') acc[key] = params[key];
      return acc;
    }, {});
    return `search:${JSON.stringify(sorted)}`;
  }
}
