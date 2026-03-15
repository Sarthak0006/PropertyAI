import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Worker, Job } from 'bullmq';
import { Client } from '@elastic/elasticsearch';
import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const connection = {
  host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379', 10),
};

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const esIndex = process.env.ELASTICSEARCH_INDEX || 'properties';

// ── Indexing Worker ─────────────────────────────────
// const indexingWorker = new Worker(
//   'indexing',
//   async (job: Job) => {
//     logger.info({ jobId: job.id, data: job.data }, 'Processing indexing job');

//     const property = job.data;
//     await esClient.index({
//       index: esIndex,
//       id: property.id.toString(),
//       body: property,
//       refresh: true,
//     });

//     logger.info({ propertyId: property.id }, 'Property indexed successfully');
//   },
//   { connection, concurrency: 5 }
// );

const indexingWorker = new Worker(
  'indexing',
  async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing indexing job');

    const property = {
      ...job.data,
      amenities: job.data.amenities?.map((a: string) => a.toLowerCase()) || []
    };

    await esClient.index({
      index: esIndex,
      id: property.id.toString(),
      body: property,
      refresh: true,
    });

    logger.info({ propertyId: property.id }, 'Property indexed successfully');
  },
  { connection, concurrency: 5 }
);

// ── Analytics Worker ────────────────────────────────
const analyticsWorker = new Worker(
  'analytics',
  async (job: Job) => {
    const { type, query, resultCount, timestamp } = job.data;
    logger.info({ type, query, resultCount, timestamp }, 'Analytics event recorded');
    // In production, store in analytics DB or send to analytics service
  },
  { connection, concurrency: 10 }
);

// ── Embedding Worker ────────────────────────────────
const embeddingWorker = new Worker(
  'embedding',
  async (job: Job) => {
    const { propertyId, text } = job.data;
    logger.info({ propertyId }, 'Generating embedding');
    // In production, call Gemini Embedding API here
    logger.info({ propertyId }, 'Embedding generated and stored');
  },
  { connection, concurrency: 3 }
);

// ── Error Handling ──────────────────────────────────
for (const worker of [indexingWorker, analyticsWorker, embeddingWorker]) {
  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id, queue: job.queueName }, 'Job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, queue: job?.queueName, error: error.message }, 'Job failed');
  });
}

logger.info('Worker service started - listening for jobs on: indexing, analytics, embedding');
