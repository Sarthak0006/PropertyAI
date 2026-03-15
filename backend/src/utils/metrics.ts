import client, { Counter, Histogram, Registry } from 'prom-client';

export const register = new Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const httpRequestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const searchLatency = new Histogram({
  name: 'search_latency_seconds',
  help: 'Elasticsearch search latency',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});

export const cacheHitRate = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['type'],
  registers: [register],
});

export const cacheMissRate = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['type'],
  registers: [register],
});
