# Backend Guide

## Architecture: Clean Architecture

```
src/
├── config/          # Elasticsearch, Redis, env config
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Data access (ES, Redis)
├── middlewares/      # Error, validation, metrics
├── validators/       # Zod schemas
├── routes/          # Express routes (/api/v1)
└── utils/           # Logger (Pino), metrics (Prometheus)
```

## Key Design Patterns

- **Repository Pattern**: `ElasticsearchRepository`, `RedisRepository` abstract data access
- **Service Layer**: `SearchService`, `PropertyService`, `SuggestionService` contain business logic
- **Dependency separation**: Controllers never touch databases directly
- **Centralized Error Handling**: `AppError` class + middleware
- **Input Validation**: Zod schemas on all endpoints

## API Versioning

All routes under `/api/v1`. Future versions at `/api/v2`.

## Security Stack

Helmet + CORS + Rate Limiting (100 req/15min) + Zod + XSS sanitization

## Development

```bash
cd backend
npm install
npm run dev    # → http://localhost:3001
npm test       # Jest tests
```
