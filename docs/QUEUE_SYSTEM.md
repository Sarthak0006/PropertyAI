# Queue System

## Overview

BullMQ (Redis-based) handles all asynchronous background processing.

## Queues

| Queue        | Purpose                            | Concurrency | Retries |
|--------------|-------------------------------------|-------------|---------|
| `indexing`   | Index properties into Elasticsearch | 5           | 3       |
| `analytics`  | Track search events and patterns    | 10          | 2       |
| `embedding`  | Generate vector embeddings          | 3           | 3       |

## Architecture

```
Backend API → Redis Queue → Worker Service → Elasticsearch / Analytics Store
```

Workers run in `worker-service/` as an independent process, scalable horizontally.

## Job Configuration

- **Indexing**: Exponential backoff (1s base), 3 retries
- **Analytics**: 2 retries, auto-remove after 100 completed
- **Embedding**: Exponential backoff (2s base), 3 retries

## Monitoring

BullMQ job status tracked via `bull-board` (available in backend dependencies).
Queue metrics exposed to Prometheus for Grafana dashboards.
