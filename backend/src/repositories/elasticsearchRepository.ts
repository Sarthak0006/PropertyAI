import { elasticsearchClient } from '../config/elasticsearch';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface PropertyDocument {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number;
  // property_type: string;
  // year_built: number;
  amenities: string[];
  has_garage: boolean;
  has_pool: boolean;
  energy_features: string[];
  smart_features: string[];
  image_url: string;
  embedding?: number[];
}

export interface SearchFilters {
  bedrooms?: number;
  bathrooms?: number;
  min_size?: number;
  max_size?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
  // property_type?: string;
  location?: string;
  has_garage?: boolean;
  has_pool?: boolean;
}

export interface SearchResult {
  total: number;
  properties: PropertyDocument[];
  page: number;
  limit: number;
  totalPages: number;
}

export class ElasticsearchRepository {
  private readonly index = config.elasticsearch.index;

  // async search(
  //   query: string | undefined,
  //   filters: SearchFilters,
  //   page: number,
  //   limit: number,
  //   sort: string,
  //   embedding?: number[]
  // ): Promise<SearchResult> {
  //   const must: any[] = [];
  //   const filter: any[] = [];

  //   // Text search
  //   if (query) {
  //     must.push({
  //       multi_match: {
  //         query,
  //         fields: ['title^3', 'description^2', 'location', 'amenities'],
  //         type: 'best_fields',
  //         fuzziness: 'AUTO',
  //       },
  //     });
  //   }

  //   // Numeric filters
  //   // if (filters.bedrooms !== undefined) filter.push({ term: { bedrooms: filters.bedrooms } });
  //   if (filters.bedrooms !== undefined) {
  //     filter.push({
  //       term: { bedrooms: filters.bedrooms }
  //     });

  //     // Also reinforce in must clause for stronger relevance
  //     must.push({
  //       term: { bedrooms: filters.bedrooms }
  //     });
  //   }
  //   if (filters.bathrooms !== undefined) filter.push({ term: { bathrooms: filters.bathrooms } });
  //   if (filters.min_size || filters.max_size) {
  //     const range: any = {};
  //     if (filters.min_size) range.gte = filters.min_size;
  //     if (filters.max_size) range.lte = filters.max_size;
  //     filter.push({ range: { size_sqft: range } });
  //   }
  //   if (filters.min_price || filters.max_price) {
  //     const range: any = {};
  //     if (filters.min_price) range.gte = filters.min_price;
  //     if (filters.max_price) range.lte = filters.max_price;
  //     filter.push({ range: { price: range } });
  //   }
  //   if (filters.property_type) filter.push({ term: { property_type: filters.property_type } });
  //   if (filters.location) {
  //     must.push({ match: { location: { query: filters.location, fuzziness: 'AUTO' } } });
  //   }
  //   if (filters.has_garage !== undefined) filter.push({ term: { has_garage: filters.has_garage } });
  //   if (filters.has_pool !== undefined) filter.push({ term: { has_pool: filters.has_pool } });
  //   if (filters.amenities && filters.amenities.length > 0) {
  //     for (const amenity of filters.amenities) {
  //       filter.push({ term: { "amenities.keyword": amenity } });
  //     }
  //   }

  //   // Sort
  //   const sortConfig = this.buildSort(sort);

  //   const from = (page - 1) * limit;
  //   const body: any = {
  //     query: {
  //       bool: {
  //         must: must.length > 0 ? must : [],
  //         filter,
  //       },
  //     },
  //     from,
  //     size: limit,
  //     sort: sortConfig,
  //   };

  //   if (embedding && embedding.length > 0 && query) {
  //     body.knn = {
  //       field: 'embedding',
  //       query_vector: embedding,
  //       k: limit * 2,
  //       num_candidates: limit * 10,
  //       // filter: filter.length > 0 ? filter : undefined,
  //       // boost: 0.5,
  //     };
  //   }

  //   // console.log("Elasticsearch Query:", JSON.stringify(body, null, 2));
  //   try {
  //     const result = await elasticsearchClient.search({
  //       index: this.index,
  //       body,
  //     });

  //     const total = typeof result.hits.total === 'number'
  //       ? result.hits.total
  //       : result.hits.total?.value || 0;

  //     const properties = result.hits.hits.map((hit: any) => ({
  //       ...hit._source,
  //       _score: hit._score,
  //     }));

  //     return {
  //       total,
  //       properties,
  //       page,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     };
  //   } catch (error) {
  //     logger.error({ error }, 'Elasticsearch search error');
  //     throw error;
  //   }
  // }

  async search(
    query: string | undefined,
    filters: SearchFilters,
    page: number,
    limit: number,
    sort: string,
    embedding?: number[]
  ): Promise<SearchResult> {
    const must: any[] = [];
    const filter: any[] = [];

    // Detect if any structured filter exists
    const hasStructuredFilters =
      filters.bedrooms !== undefined ||
      filters.bathrooms !== undefined ||
      filters.min_size !== undefined ||
      filters.max_size !== undefined ||
      filters.min_price !== undefined ||
      filters.max_price !== undefined ||
      // filters.property_type !== undefined ||
      filters.location !== undefined ||
      filters.has_garage !== undefined ||
      filters.has_pool !== undefined ||
      (filters.amenities && filters.amenities.length > 0);

    // Text search
    // if (query) {
    //   must.push({
    //     multi_match: {
    //       query,
    //       fields: ['title^3', 'description^2', 'location', 'amenities'],
    //       type: 'best_fields',
    //       fuzziness: hasStructuredFilters ? 0 : 'AUTO'
    //     },
    //   });
    // }

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'description^2', 'location'],
          type: 'best_fields',
          fuzziness: hasStructuredFilters ? 0 : 'AUTO'
        }
      });

      // allow amenities matching
      must.push({
        match: {
          amenities: {
            query,
            boost: 4
          }
        }
      });
    }

    // Bedrooms (strict filter + ranking reinforcement)
    if (filters.bedrooms !== undefined) {
      filter.push({
        term: { bedrooms: filters.bedrooms }
      });

      must.push({
        term: { bedrooms: filters.bedrooms }
      });
    }

    // Bathrooms
    if (filters.bathrooms !== undefined) {
      filter.push({ term: { bathrooms: filters.bathrooms } });
    }

    // Size filter
    if (filters.min_size || filters.max_size) {
      const range: any = {};
      if (filters.min_size) range.gte = filters.min_size;
      if (filters.max_size) range.lte = filters.max_size;

      filter.push({
        range: { size_sqft: range }
      });
    }

    // Price filter
    if (filters.min_price || filters.max_price) {
      const range: any = {};
      if (filters.min_price) range.gte = filters.min_price;
      if (filters.max_price) range.lte = filters.max_price;

      filter.push({
        range: { price: range }
      });
    }

    // Property type (exact match)
    // if (filters.property_type) {
    //   filter.push({
    //     term: { "property_type.keyword": filters.property_type }
    //   });
    // }

    // Location filter
    // if (filters.location) {
    //   filter.push({
    //     match: {
    //       location: {
    //         query: filters.location,
    //         operator: "and"
    //       }
    //     }
    //   });
    // }

    if (filters.location) {
      filter.push({
        bool: {
          should: [
            {
              term: { "location.keyword": filters.location }
            },
            {
              match: { location: filters.location }
            }
          ]
        }
      });
    }

    // Garage filter
    if (filters.has_garage !== undefined) {
      filter.push({
        term: { has_garage: filters.has_garage }
      });
    }

    // Pool filter
    if (filters.has_pool !== undefined) {
      filter.push({
        term: { has_pool: filters.has_pool }
      });
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      filter.push({
        terms: {
          amenities: filters.amenities
        }
      });
    }

    // Sort
    const sortConfig = this.buildSort(sort);

    const from = (page - 1) * limit;

    const body: any = {
      _source: {
        excludes: ["embedding"]
      },
      query: {
        bool: {
          must: must.length > 0 ? must : [],
          filter
        }
      },
      from,
      size: limit,
      sort: sortConfig,
      min_score: 0.15
    };

    // Hybrid vector search
    if (embedding && embedding.length > 0 && query) {
      body.knn = {
        field: 'embedding',
        query_vector: embedding,
        k: limit * 2,
        num_candidates: limit * 10,
        // filter: filter.length > 0 ? { bool: { filter } } : undefined
        filter: filter.length > 0 ? filter : undefined
      };
    }

    try {
      const result = await elasticsearchClient.search({
        index: this.index,
        body,
      });

      const total = typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

      const properties = result.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      }));

      return {
        total,
        properties,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ error }, 'Elasticsearch search error');
      throw error;
    }
  }

  async getById(id: number): Promise<PropertyDocument | null> {
    try {
      const result = await elasticsearchClient.search({
        index: this.index,
        body: {
          query: { term: { id } },
          size: 1,
        },
      });

      if (result.hits.hits.length === 0) return null;
      return result.hits.hits[0]._source as PropertyDocument;
    } catch (error) {
      logger.error({ error, id }, 'Error fetching property by ID');
      return null;
    }
  }

  async getByIds(ids: number[]): Promise<PropertyDocument[]> {
    try {
      const result = await elasticsearchClient.search({
        index: this.index,
        body: {
          query: { terms: { id: ids } },
          size: ids.length,
        },
      });

      return result.hits.hits.map((hit: any) => hit._source as PropertyDocument);
    } catch (error) {
      logger.error({ error, ids }, 'Error fetching properties by IDs');
      return [];
    }
  }

  async findSimilar(id: number, limit: number = 5): Promise<PropertyDocument[]> {
    const property = await this.getById(id);
    if (!property) return [];

    // Use a more-like-this query for similarity
    try {
      const result = await elasticsearchClient.search({
        index: this.index,
        body: {
          query: {
            bool: {
              must: [
                {
                  more_like_this: {
                    fields: ['title', 'description', 'amenities'],
                    like: [
                      {
                        _index: this.index,
                        _id: id.toString(),
                      },
                    ],
                    min_term_freq: 1,
                    min_doc_freq: 1,
                    max_query_terms: 25,
                  },
                },
              ],
              must_not: [{ term: { id } }],
            },
          },
          size: limit,
        },
      });

      return result.hits.hits.map((hit: any) => hit._source as PropertyDocument);
    } catch (error) {
      // Fallback: return properties with similar attributes
      logger.warn({ error }, 'MLT query failed, using attribute-based similarity');
      const result = await elasticsearchClient.search({
        index: this.index,
        body: {
          query: {
            bool: {
              should: [
                { term: { bedrooms: property.bedrooms } },
                // { term: { property_type: property.property_type } },
                { range: { price: { gte: property.price * 0.7, lte: property.price * 1.3 } } },
              ],
              must_not: [{ term: { id } }],
              minimum_should_match: 1,
            },
          },
          size: limit,
        },
      });

      return result.hits.hits.map((hit: any) => hit._source as PropertyDocument);
    }
  }

  async suggest(prefix: string): Promise<string[]> {
    try {
      const result = await elasticsearchClient.search({
        index: this.index,
        body: {
          suggest: {
            property_suggest: {
              prefix,
              completion: {
                field: 'suggest',
                size: 10,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      const suggestions = (result.suggest as any)?.property_suggest?.[0]?.options || [];
      return suggestions.map((s: any) => s.text);
    } catch (error) {
      logger.error({ error }, 'Suggestion query error');
      return [];
    }
  }

  private buildSort(sort: string): any[] {
    switch (sort) {
      case 'price_asc': return [{ price: 'asc' }];
      case 'price_desc': return [{ price: 'desc' }];
      case 'size_asc': return [{ size_sqft: 'asc' }];
      case 'size_desc': return [{ size_sqft: 'desc' }];
      // case 'newest': return [{ year_built: 'desc' }];
      default: return [{ _score: 'desc' }];
    }
  }
}
