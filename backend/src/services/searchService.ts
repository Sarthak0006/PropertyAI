import { ElasticsearchRepository, SearchFilters, SearchResult, PropertyDocument } from '../repositories/elasticsearchRepository';
import { AIAgentService } from './aiAgentService';
import { CacheService } from './cacheService';
import { RedisRepository } from '../repositories/redisRepository';
import { searchLatency } from '../utils/metrics';
import { logger } from '../utils/logger';

export class SearchService {
  private readonly esRepo: ElasticsearchRepository;
  private readonly aiAgent: AIAgentService;
  private readonly cache: CacheService;
  private readonly redis: RedisRepository;

  constructor() {
    this.esRepo = new ElasticsearchRepository();
    this.aiAgent = new AIAgentService();
    this.redis = new RedisRepository();
    this.cache = new CacheService(this.redis);
  }

  async search(params: {
    q?: string;
    bedrooms?: number;
    bathrooms?: number;
    min_size?: number;
    max_size?: number;
    min_price?: number;
    max_price?: number;
    amenities?: string;
    // property_type?: string;
    location?: string;
    has_garage?: boolean;
    has_pool?: boolean;
    page: number;
    limit: number;
    sort: string;
  }): Promise<SearchResult> {
    // Check cache
    const cacheKey = this.cache.buildSearchCacheKey(params);
    const cached = await this.cache.getSearchResults<SearchResult>(cacheKey);
    if (cached) {
      logger.info('Search cache hit');
      return cached;
    }

    let filters: SearchFilters = {
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      min_size: params.min_size,
      max_size: params.max_size,
      min_price: params.min_price,
      max_price: params.max_price,
      // property_type: params.property_type,
      location: params.location,
      has_garage: params.has_garage,
      has_pool: params.has_pool,
      amenities: params.amenities ? params.amenities.split(',').map(a => a.trim()) : undefined,
    };

    let searchQuery = params.q;
    let aiKeywords;
    let queryEmbedding: number[] | undefined;

    // If natural language query, parse with AI agent
    // if (params.q && this.isNaturalLanguageQuery(params.q)) {
    if (params.q) {
      const aiResult = await this.aiAgent.parseQuery(params.q);
      if (aiResult) {
        const af = aiResult.filters;
        aiKeywords = af.keywords?.join(" ") || "";
        queryEmbedding = aiResult.embedding;
        // Merge AI-extracted filters with explicit filters (explicit takes precedence)
        filters = {
          bedrooms: params.bedrooms ?? af.bedrooms ?? undefined,
          bathrooms: params.bathrooms ?? af.bathrooms ?? undefined,
          min_size: params.min_size ?? af.min_size_sqft ?? undefined,
          max_size: params.max_size ?? af.max_size_sqft ?? undefined,
          min_price: params.min_price ?? af.min_price ?? undefined,
          max_price: params.max_price ?? af.max_price ?? undefined,
          // property_type: params.property_type ?? af.property_type ?? undefined,
          location: params.location ?? af.location ?? undefined,
          has_garage: params.has_garage ?? af.has_garage ?? undefined,
          has_pool: params.has_pool ?? af.has_pool ?? undefined,
          amenities: params.amenities
            ? params.amenities.split(',').map(a => a.trim())
            : af.amenities?.length ? af.amenities : undefined,
        };
      }
    }
    console.log(aiKeywords ? aiKeywords : searchQuery, filters, params.page, params.limit, params.sort);
    // Execute search with timing
    const timer = searchLatency.startTimer();
    const result = await this.esRepo.search(aiKeywords ? aiKeywords : searchQuery, filters, params.page, params.limit, params.sort, queryEmbedding);
    timer();

    // Cache results
    await this.cache.setSearchResults(cacheKey, result);

    // Track query
    if (params.q) {
      await this.redis.addToSearchHistory(params.q);
      await this.redis.incrementQueryCount(params.q);
    }
    console.log(result);
    return result;
  }

  private isNaturalLanguageQuery(query: string): boolean {
    // Heuristic: if query has more than 2 words or contains common NL patterns
    const words = query.trim().split(/\s+/);
    if (words.length >= 2) return true;
    const nlPatterns = /\b(with|near|under|over|bigger|smaller|than|less|more|budget|luxury|cheap|affordable)\b/i;
    return nlPatterns.test(query);
  }
}

export class PropertyService {
  private readonly esRepo: ElasticsearchRepository;
  private readonly cache: CacheService;

  constructor() {
    this.esRepo = new ElasticsearchRepository();
    this.cache = new CacheService(new RedisRepository());
  }

  async getById(id: number): Promise<PropertyDocument | null> {
    const cached = await this.cache.getProperty<PropertyDocument>(id);
    if (cached) return cached;

    const property = await this.esRepo.getById(id);
    if (property) await this.cache.setProperty(id, property);
    return property;
  }

  async compare(ids: number[]): Promise<PropertyDocument[]> {
    return this.esRepo.getByIds(ids);
  }

  async findSimilar(id: number): Promise<PropertyDocument[]> {
    return this.esRepo.findSimilar(id, 5);
  }
}

export class SuggestionService {
  private readonly esRepo: ElasticsearchRepository;
  private readonly redis: RedisRepository;
  private readonly cache: CacheService;

  constructor() {
    this.esRepo = new ElasticsearchRepository();
    this.redis = new RedisRepository();
    this.cache = new CacheService(this.redis);
  }

  async getSuggestions(prefix: string): Promise<{
    suggestions: string[];
    recentSearches: string[];
    popularSearches: string[];
  }> {
    // Check cache
    const cached = await this.cache.getSuggestions(prefix);

    const recentSearches = await this.redis.getSearchHistory(5);
    const popularSearches = await this.redis.getPopularQueries(5);

    let suggestions: string[];
    if (cached) {
      suggestions = cached;
    } else {
      suggestions = await this.esRepo.suggest(prefix);
      // Add some default suggestions based on prefix
      const defaults = this.getDefaultSuggestions(prefix);
      suggestions = [...new Set([...suggestions, ...defaults])].slice(0, 10);
      await this.cache.setSuggestions(prefix, suggestions);
    }

    return { suggestions, recentSearches, popularSearches };
  }

  private getDefaultSuggestions(prefix: string): string[] {
    const all = [
      '3 bedroom apartment',
      '3 bedroom house with gym',
      '3 bedroom house with garage',
      '2 bedroom condo',
      'luxury villa',
      'smart home',
      'budget apartment',
      'house with swimming pool',
      'penthouse with view',
      'modern townhouse',
    ];
    const lower = prefix.toLowerCase();
    return all.filter(s => s.includes(lower));
  }
}
