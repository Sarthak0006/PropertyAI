import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

const userService = new UserService();

// Helper to get userId (mocked auth)
const getUserId = (req: Request) => req.headers['x-user-id'] as string || 'anonymous';

export class UserController {
  saveProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.body;
      const userId = getUserId(req);
      
      if (!propertyId) {
        res.status(400).json({ success: false, error: 'Property ID is required' });
        return;
      }
      
      const saved = await userService.saveProperty(userId, propertyId);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  };

  unsaveProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: propertyId } = req.params;
      const userId = getUserId(req);
      
      await userService.unsaveProperty(userId, propertyId);
      res.status(200).json({ success: true, message: 'Property unsaved successfully' });
    } catch (error) {
      next(error);
    }
  };

  getSavedProperties = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const propertyIds = await userService.getSavedProperties(userId);
      res.status(200).json({ success: true, data: propertyIds });
    } catch (error) {
      next(error);
    }
  };
}
