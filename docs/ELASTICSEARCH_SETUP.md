# Elasticsearch Setup

## Running Locally (Docker)

```bash
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" \
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0
```

## Index Schema

The `properties` index uses:
- **Text fields**: `title`, `description` with custom analyzer (standard + lowercase + stop + snowball)
- **Keyword fields**: `amenities`, `energy_features`, `smart_features`
- **Numeric fields**: `id`, `price`, `bedrooms`, `bathrooms`, `size_sqft`
- **Boolean fields**: `has_garage`, `has_pool`
- **Dense vector**: `embedding` (3072 dims, cosine similarity)
- **Completion**: `suggest` for autocomplete

## Data Ingestion

```bash
cd search-indexer
npm install
npm run dev
```

This reads `data/properties.json`, creates the index, and indexes all documents with embeddings and suggestions.

## Verification

```bash
curl http://localhost:9200/properties/_count
curl http://localhost:9200/properties/_search?q=gym
```
