import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { generateEmbedding } from './embedding-model';
import { Client } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } },
});

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'properties';

// ── Index Schema ────────────────────────────────────
const indexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        property_analyzer: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase', 'stop', 'snowball'],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: 'integer' as const },
      title: {
        type: 'text' as const,
        analyzer: 'property_analyzer',
        fields: { keyword: { type: 'keyword' as const } },
      },
      description: { type: 'text' as const, analyzer: 'property_analyzer' },
      price: { type: 'integer' as const },
      location: {
        type: 'text' as const,
        fields: { keyword: { type: 'keyword' as const } },
      },
      bedrooms: { type: 'integer' as const },
      bathrooms: { type: 'integer' as const },
      size_sqft: { type: 'integer' as const },
      property_type: { type: 'keyword' as const },
      // year_built: { type: 'integer' as const },
      amenities: { type: 'keyword' as const },
      has_garage: { type: 'boolean' as const },
      has_pool: { type: 'boolean' as const },
      energy_features: { type: 'keyword' as const },
      smart_features: { type: 'keyword' as const },
      image_url: { type: 'keyword' as const },
      embedding: {
        type: 'dense_vector' as const,
        dims: 3072,
        index: true,
        similarity: 'cosine' as const,
      },
      suggest: {
        type: 'completion' as const,
        analyzer: 'simple',
      },
    },
  },
};

// ── Helpers: Derive fields from raw data ────────────

/**
 * Detect property type from the title string.
 */
function detectPropertyType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('villa')) return 'Villa';
  if (t.includes('penthouse')) return 'Penthouse';
  if (t.includes('condo')) return 'Condo';
  if (t.includes('townhouse')) return 'Townhouse';
  if (t.includes('duplex')) return 'Duplex';
  if (t.includes('studio')) return 'Studio';
  if (t.includes('house') || t.includes('home')) return 'House';
  if (t.includes('apartment') || t.includes('bhk')) return 'Apartment';
  return 'Property';
}

/**
 * Auto-generate a description from the merged data.
 */
function generateDescription(merged: any): string {
  const parts: string[] = [];
  parts.push(`${merged.title} located in ${merged.location}.`);
  if (merged.bedrooms && merged.bathrooms) {
    parts.push(`Features ${merged.bedrooms} bedroom(s) and ${merged.bathrooms} bathroom(s)`);
    parts.push(`with ${merged.size_sqft?.toLocaleString() || 'N/A'} sqft of living space.`);
  }
  if (merged.amenities?.length) {
    parts.push(`Amenities include ${merged.amenities.join(', ')}.`);
  }
  parts.push(`Listed at $${merged.price?.toLocaleString()}.`);
  return parts.join(' ');
}

/**
 * Detect special features from amenities list.
 */
function detectFeatures(amenities: string[]): {
  has_garage: boolean;
  has_pool: boolean;
  smart_features: string[];
  energy_features: string[];
} {
  const lower = amenities.map((a) => a.toLowerCase());
  return {
    has_garage: lower.some((a) => a.includes('garage')),
    has_pool: lower.some((a) => a.includes('pool')),
    smart_features: amenities.filter((a) =>
      ['smart home', 'smart appliances', 'smart security'].some((k) =>
        a.toLowerCase().includes(k)
      )
    ),
    energy_features: amenities.filter((a) =>
      ['solar', 'energy efficient'].some((k) => a.toLowerCase().includes(k))
    ),
  };
}

// ── Helper: Generate Suggestion Inputs ──────────────
function generateSuggestInputs(property: any): string[] {
  const inputs: string[] = [];

  if (property.title) inputs.push(property.title);

  if (property.bedrooms) {
    inputs.push(`${property.bedrooms} bedroom`);
    inputs.push(`${property.bedrooms} bedroom ${property.property_type?.toLowerCase() || 'property'}`);
    inputs.push(`${property.bedrooms} bhk`);
  }

  if (property.amenities) {
    for (const amenity of property.amenities) {
      inputs.push(`${property.property_type?.toLowerCase() || 'property'} with ${amenity.toLowerCase()}`);
    }
  }

  if (property.location) {
    inputs.push(`property in ${property.location}`);
  }

  return [...new Set(inputs)];
}

// ── Load & Merge the 3 Source JSON Files ────────────
function loadAndMergeData(): any[] {
  // Use DATA_DIR from env, or fallback to the data directory when running locally
  const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../../data');

  // JSON 1: { id, title, price, location }
  const json1Path = path.join(dataDir, 'json1.json');
  const json1: any[] = JSON.parse(fs.readFileSync(json1Path, 'utf-8'));
  logger.info(`Loaded ${json1.length} records from JSON 1 (title, price, location)`);

  // JSON 2: { id, bedrooms, bathrooms, size_sqft, amenities }
  const json2Path = path.join(dataDir, 'json2.json');
  const json2: any[] = JSON.parse(fs.readFileSync(json2Path, 'utf-8'));
  logger.info(`Loaded ${json2.length} records from JSON 2 (bedrooms, bathrooms, amenities)`);

  // JSON 3: { id, image_url }
  const json3Path = path.join(dataDir, 'json3.json');
  const json3: any[] = JSON.parse(fs.readFileSync(json3Path, 'utf-8'));
  logger.info(`Loaded ${json3.length} records from JSON 3 (image_url)`);

  // Index by id for fast lookup
  const byId2 = new Map(json2.map((r) => [r.id, r]));
  const byId3 = new Map(json3.map((r) => [r.id, r]));

  // Merge by id
  const merged = json1.map((record) => {
    const details = byId2.get(record.id) || {};
    const images = byId3.get(record.id) || {};
    const amenities: string[] = details.amenities || [];
    const features = detectFeatures(amenities);

    return {
      id: record.id,
      title: record.title,
      price: record.price,
      location: record.location,
      bedrooms: details.bedrooms || 0,
      bathrooms: details.bathrooms || 0,
      size_sqft: details.size_sqft || 0,
      amenities,
      image_url: images.image_url || '',
      property_type: detectPropertyType(record.title),
      description: '', // will be filled below
      ...features,
    };
  });

  // Generate descriptions after all fields are set
  for (const property of merged) {
    property.description = generateDescription(property);
  }

  logger.info(`Merged ${merged.length} properties from 3 source files`);
  return merged;
}

// ── Main Ingestion ──────────────────────────────────
async function ingest(): Promise<void> {
  logger.info('Starting data ingestion pipeline...');

  // Wait for Elasticsearch to be ready
  let retries = 30;
  while (retries > 0) {
    try {
      await esClient.cluster.health();
      break;
    } catch {
      logger.info(`Waiting for Elasticsearch... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 2000));
      retries--;
    }
  }

  if (retries === 0) {
    logger.error('Elasticsearch not available - aborting');
    process.exit(1);
  }

  // Delete existing index
  const exists = await esClient.indices.exists({ index: INDEX_NAME });
  if (exists) {
    await esClient.indices.delete({ index: INDEX_NAME });
    logger.info(`Deleted existing index: ${INDEX_NAME}`);
  }

  // Create index
  await esClient.indices.create({
    index: INDEX_NAME,
    body: indexMapping,
  });
  logger.info(`Created index: ${INDEX_NAME}`);

  // Load & merge properties from 3 source files
  const properties = loadAndMergeData();

  // Index each property
  for (const property of properties) {
    function buildEmbeddingText(property: any): string {
      return `
          ${property.title} in ${property.location}.
          ${property.property_type} with ${property.bedrooms} bedrooms and ${property.bathrooms} bathrooms.
          Size: ${property.size_sqft} sqft.
          Amenities: ${property.amenities?.join(', ')}.
          ${property.description}
      `;
    }
    const textForEmbedding = buildEmbeddingText(property);
    const embedding = await generateEmbedding(textForEmbedding);

    // Generate suggestion inputs
    const suggestInputs = generateSuggestInputs(property);

    const doc = {
      ...property,
      embedding,
      suggest: {
        input: suggestInputs,
        weight: property.price > 800000 ? 10 : 5,
      },
    };

    await esClient.index({
      index: INDEX_NAME,
      id: property.id.toString(),
      body: doc,
      refresh: true,
    });

    logger.info({ id: property.id, title: property.title }, 'Indexed property');
  }

  // Refresh index
  await esClient.indices.refresh({ index: INDEX_NAME });

  const count = await esClient.count({ index: INDEX_NAME });
  logger.info(`Ingestion complete! Total documents: ${count.count}`);

  process.exit(0);
}

ingest().catch((error) => {
  logger.error({ error }, 'Ingestion failed');
  process.exit(1);
});

