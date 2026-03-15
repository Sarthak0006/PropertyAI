# Search Architecture

## Hybrid Search Strategy

The platform combines **three search techniques**:

### 1. BM25 Text Search
- Full-text search on `title`, `description`, `location`, `amenities`
- Custom analyzer: standard tokenizer + lowercase + stop words + snowball stemming
- Fuzzy matching enabled (`fuzziness: AUTO`)
- Field boosting: title (3x) > description (2x) > location > amenities

### 2. Dense Vector Search
- 3072-dimensional embeddings stored per property
- Cosine similarity for kNN nearest neighbor search
- Embeddings generated via Gemini Embedding API (dummy in dev)
- Enables semantic similarity beyond keyword matching

### 3. Completion Suggester
- Pre-indexed suggestion inputs per property
- Inputs include: title, bedroom-based, amenity-based, location-based variations
- Weighted by property price (luxury properties get higher weight)
- Supports prefix matching with deduplication

## Elasticsearch Index Schema

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "integer" },
      "title": { "type": "text", "analyzer": "property_analyzer" },
      "description": { "type": "text", "analyzer": "property_analyzer" },
      "bedrooms": { "type": "integer" },
      "bathrooms": { "type": "integer" },
      "size_sqft": { "type": "integer" },
      "price": { "type": "integer" },
      // "property_type": { "type": "keyword" },
      "amenities": { "type": "keyword" },
      "embedding": { "type": "dense_vector", "dims": 3072, "similarity": "cosine" },
      "suggest": { "type": "completion" }
    }
  }
}
```

## Similar Property Algorithm

1. **Primary**: Elasticsearch `more_like_this` query on title, description, amenities
2. **Fallback**: Attribute-based matching (same bedrooms, property type, ±30% price range)
