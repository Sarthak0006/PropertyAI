# Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              React + Vite + TailwindCSS                      │
│    ┌──────────┐  ┌──────────┐  ┌────────────┐               │
│    │  Search   │  │ Property │  │  Compare   │               │
│    │   Page    │  │  Detail  │  │   Page     │               │
│    └────┬─────┘  └────┬─────┘  └─────┬──────┘               │
│         └──────────────┴──────────────┘                      │
│                     React Query + Axios                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP / REST
┌─────────────────────────▼───────────────────────────────────┐
│                      BACKEND API                             │
│               Node.js + Express + TypeScript                 │
│   ┌────────────┐  ┌──────────┐  ┌───────────┐               │
│   │ Controllers │  │ Services │  │   Repos   │               │
│   └─────┬──────┘  └────┬─────┘  └─────┬─────┘               │
│         │              │              │                      │
│   ┌─────▼──────────────▼──────────────▼─────┐               │
│   │  Middlewares: Helmet, CORS, Rate Limit,  │               │
│   │  Zod Validation, Metrics, Error Handler  │               │
│   └─────────────────────────────────────────┘               │
└──────┬──────────────┬───────────────┬───────────────────────┘
       │              │               │
       ▼              ▼               ▼
┌──────────┐   ┌──────────┐    ┌──────────┐
│ AI Agent │   │  Elastic  │   │  Redis   │
│ (FastAPI)│   │  search   │   │          │
│ + Gemini │   │ (Hybrid)  │   │ Cache +  │
└──────────┘   └──────────┘   │ Queues   │
                               └────┬─────┘
                                    │
                              ┌─────▼─────┐
                              │  Workers   │
                              │  (BullMQ)  │
                              └────────────┘
```

## Service Interaction Flow

### Search Request Sequence

```
User → Frontend → Backend → AI Agent (if NL query)
                          → Elasticsearch (hybrid search)
                          → Redis (cache check/store)
                          → Backend → Frontend → User
```

### Data Ingestion Flow

```
properties.json → Search Indexer → Elasticsearch
                                 → Generate embeddings
                                 → Create completion suggestions
```

## Services

| Service         | Technology            | Port  | Purpose                            |
|-----------------|----------------------|-------|------------------------------------|
| Frontend        | React + Vite         | 5173  | User interface                     |
| Backend         | Express + TypeScript | 3001  | REST API, orchestration            |
| AI Agent        | FastAPI + Python     | 8000  | NLP query parsing via Gemini       |
| Worker Service  | BullMQ               | —     | Background job processing          |
| Search Indexer  | TypeScript           | —     | Data ingestion to Elasticsearch    |
| Elasticsearch   | v8.12                | 9200  | Hybrid search engine               |
| Redis           | v7                   | 6379  | Cache + queue broker               |
| Prometheus      | v2.49                | 9090  | Metrics collection                 |
| Grafana         | v10.3                | 3000  | Metrics visualization              |

## Caching Strategy

- **Search results**: 5-minute TTL in Redis
- **Property details**: 1-hour TTL
- **Suggestions**: 10-minute TTL
- **Search history**: Last 100 queries (LPUSH + LTRIM)
- **Popular queries**: Sorted set (ZINCRBY)

## Scaling Strategy

- **Stateless backend**: Horizontal pod scaling
- **Elasticsearch**: Multi-node cluster, sharding
- **Redis**: Sentinel or Cluster mode
- **Workers**: Scale independently per queue
- **Frontend**: CDN-deployable static build
