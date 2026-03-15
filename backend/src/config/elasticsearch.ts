import { Client } from '@elastic/elasticsearch';
import { config } from './index';

export const elasticsearchClient = new Client({
  node: config.elasticsearch.url,
});

export async function ensureElasticsearchIndex(): Promise<void> {
  const indexName = config.elasticsearch.index;
  const exists = await elasticsearchClient.indices.exists({ index: indexName });

  if (!exists) {
    await elasticsearchClient.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              property_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball'],
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'integer' },
            title: {
              type: 'text',
              analyzer: 'property_analyzer',
              fields: { keyword: { type: 'keyword' } },
            },
            description: {
              type: 'text',
              analyzer: 'property_analyzer',
            },
            price: { type: 'integer' },
            location: {
              type: 'text',
              fields: { keyword: { type: 'keyword' } },
            },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            size_sqft: { type: 'integer' },
            // property_type: { type: 'keyword' },
            // year_built: { type: 'integer' },
            amenities: { type: 'keyword' },
            has_garage: { type: 'boolean' },
            has_pool: { type: 'boolean' },
            energy_features: { type: 'keyword' },
            smart_features: { type: 'keyword' },
            image_url: { type: 'keyword' },
            embedding: {
              type: 'dense_vector',
              dims: 3072,
              index: true,
              similarity: 'cosine',
            },
            suggest: {
              type: 'completion',
              analyzer: 'simple',
            },
          },
        },
      },
    });
    console.log(`Created Elasticsearch index: ${indexName}`);
  }
}
