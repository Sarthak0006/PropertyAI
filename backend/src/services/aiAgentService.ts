import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

interface AIFilters {
  bedrooms?: number;
  bathrooms?: number;
  min_size_sqft?: number;
  max_size_sqft?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
  // property_type?: string;
  location?: string;
  has_garage?: boolean;
  has_pool?: boolean;
  smart_features?: string[];
  energy_features?: string[];
  keywords?: string[];
}

interface AIResponse {
  original_query: string;
  filters: AIFilters;
  confidence: number;
  method: string;
  embedding?: number[];
}

export class AIAgentService {
  private readonly baseUrl = config.aiAgent.url;

  async parseQuery(query: string): Promise<AIResponse | null> {
    try {
      const response = await axios.post<AIResponse>(
        `${this.baseUrl}/api/v1/parse-query`,
        { query },
        { timeout: 50000 }
      );
      // console.log(response.data);
      return response.data;
    } catch (error) {
      logger.error({ error }, 'AI Agent request failed');
      return null;
    }
  }

  async compareProperties(properties: any[]): Promise<string> {
    try {
      const response = await axios.post<{ ai_summary: string }>(
        `${this.baseUrl}/api/v1/compare`,
        { properties },
        { timeout: 15000 }
      );
      return response.data.ai_summary;
    } catch (error) {
      logger.error({ error }, 'AI summary request failed');
      return 'AI comparison is currently unavailable.';
    }
  }
}
