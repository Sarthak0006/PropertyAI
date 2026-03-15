import { SavedProperty } from '../models/SavedProperty';
import { logger } from '../utils/logger';

export class UserService {
  async saveProperty(userId: string, propertyId: string) {
    try {
      const existing = await SavedProperty.findOne({ userId, propertyId });
      if (existing) {
        return existing;
      }
      const saved = new SavedProperty({ userId, propertyId });
      await saved.save();
      return saved;
    } catch (error) {
      logger.error({ error, userId, propertyId }, 'Error saving property');
      throw new Error('Failed to save property');
    }
  }

  async unsaveProperty(userId: string, propertyId: string) {
    try {
      await SavedProperty.findOneAndDelete({ userId, propertyId });
      return true;
    } catch (error) {
      logger.error({ error, userId, propertyId }, 'Error unsaving property');
      throw new Error('Failed to unsave property');
    }
  }

  async getSavedProperties(userId: string) {
    try {
      const saved = await SavedProperty.find({ userId }).sort({ savedAt: -1 });
      return saved.map(s => s.propertyId);
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching saved properties');
      throw new Error('Failed to fetch saved properties');
    }
  }
}
