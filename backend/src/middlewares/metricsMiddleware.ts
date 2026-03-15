import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestCount } from '../utils/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestCount.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
}
