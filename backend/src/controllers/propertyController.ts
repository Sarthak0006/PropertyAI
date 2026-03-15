import { Request, Response, NextFunction } from 'express';
import { PropertyService } from '../services/searchService';
import { AIAgentService } from '../services/aiAgentService';

const propertyService = new PropertyService();
const aiAgentService = new AIAgentService();

export class PropertyController {
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const property = await propertyService.getById(id);

      if (!property) {
        res.status(404).json({ success: false, error: 'Property not found' });
        return;
      }

      res.json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }

  static async compare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ids = (req.query.ids as string).split(',').map(id => parseInt(id.trim(), 10));

      if (ids.length > 5) {
        res.status(400).json({ success: false, error: 'Maximum 5 properties can be compared' });
        return;
      }

      const properties = await propertyService.compare(ids);

      // Simplify properties object for AI token limit
      const summaryProps = properties.map(p => ({
        title: p.title,
        price: p.price,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        size_sqft: p.size_sqft,
        // property_type: p.property_type,
      }));

      const ai_summary = await aiAgentService.compareProperties(summaryProps);

      res.json({ success: true, data: { properties, ai_summary, count: properties.length } });
    } catch (error) {
      next(error);
    }
  }

  static async getSimilar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const similar = await propertyService.findSimilar(id);
      res.json({ success: true, data: similar });
    } catch (error) {
      next(error);
    }
  }
}
