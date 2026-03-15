# System Design

## Design Principles

1. **Clean Architecture** — Layered separation (controllers → services → repositories)
2. **Microservice-Ready** — Each service runs independently in Docker
3. **Stateless Backend** — No session state; all state in Elasticsearch/Redis
4. **Async Processing** — Heavy work offloaded to BullMQ workers
5. **Hybrid Search** — BM25 text + dense vector + completion suggestions

## Data Flow

### 1. User Search

```
1. User types query in SearchBar
2. Frontend debounces → calls /suggestions API
3. User submits → calls /search API with query + filters
4. Backend detects NL query → forwards to AI Agent
5. AI Agent (Gemini/fallback) returns structured filters
6. Backend merges filters → builds Elasticsearch query
7. Elasticsearch executes hybrid search (BM25 + vector kNN)
8. Results returned, cached in Redis (5min TTL)
9. Analytics event queued to BullMQ
10. Frontend renders property grid
```

### 2. Property Comparison

```
1. User clicks "Add to Compare" on property cards (max 5)
2. Floating bar appears with count
3. User clicks "Compare Now"
4. Frontend calls /properties/compare?ids=1,2,5
5. Backend fetches from Elasticsearch (or cache)
6. Returns structured comparison data
7. Frontend renders side-by-side table
```

### 3. Data Ingestion

```
1. search-indexer reads data/properties.json
2. Creates Elasticsearch index with mappings
3. For each property:
   - Generates embedding vector (3072 dims)
   - Creates completion suggestions
   - Indexes document
4. Refreshes index
```

## Technology Choices

| Decision                | Choice            | Rationale                      |
|------------------------|-------------------|--------------------------------|
| Frontend framework     | React + Vite      | Fast build, TypeScript support |
| Backend framework      | Express           | Mature, well-documented        |
| AI processing          | Gemini API        | Structured extraction          |
| Search engine          | Elasticsearch     | Hybrid search, kNN, completion |
| Cache layer            | Redis             | Speed + pub/sub + queuing      |
| Queue system           | BullMQ            | Redis-native, reliable         |
| Monitoring             | Prometheus+Grafana| Industry standard              |
| Containerization       | Docker Compose    | Local dev + prod parity        |

## Security Measures

- **Helmet**: HTTP security headers
- **CORS**: Configurable origins
- **Rate Limiting**: 100 requests per 15 minutes
- **Zod Validation**: All input validated
- **XSS Protection**: Input sanitization via `xss` library
- **Environment Variables**: Secrets in `.env`, not code

## Error Handling

- `AppError` class for operational errors (400, 404, etc.)
- Centralized error handler middleware
- Structured logging via Pino
- Frontend: React Query retry (2 attempts) + error states
