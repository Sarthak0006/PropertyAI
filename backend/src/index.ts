import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { metricsMiddleware } from './middlewares/metricsMiddleware';
import { register } from './utils/metrics';
import { logger } from './utils/logger';
import v1Routes from './routes/v1';
import { connectDB } from './config/db';

const app = express();

// ── Security ────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ───────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  })
);

// ── Metrics ─────────────────────────────────────────
app.use(metricsMiddleware);

// ── Health ──────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend', version: '1.0.0' });
});

// ── Prometheus Metrics Endpoint ─────────────────────
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// ── API Routes ──────────────────────────────────────
app.use('/api/v1', v1Routes);

// ── Error Handling ──────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ────────────────────────────────────
const startServer = async () => {
  // Connect to MongoDB
  await connectDB(config.mongodb.uri);

  app.listen(config.port, () => {
    logger.info(`Backend server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Elasticsearch: ${config.elasticsearch.url}`);
    logger.info(`Redis: ${config.redis.url}`);
    logger.info(`MongoDB: connected`);
  });
};

startServer();

export default app;
