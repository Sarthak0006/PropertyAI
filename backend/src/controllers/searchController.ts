import { Request, Response, NextFunction } from 'express';
import { SearchService, SuggestionService } from '../services/searchService';
import { QueueService } from '../services/queueService';

const searchService = new SearchService();
const suggestionService = new SuggestionService();
const queueService = new QueueService();

export class SearchController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await searchService.search(req.query as any);

      // Track analytics asynchronously
      if (req.query.q) {
        queueService.addAnalyticsJob({
          type: 'search',
          query: req.query.q,
          resultCount: result.total,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async suggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query as { q: string };
      const result = await suggestionService.getSuggestions(q);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
