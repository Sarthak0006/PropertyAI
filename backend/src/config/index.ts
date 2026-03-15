import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),

  // Elasticsearch
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'properties',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate',
  },

  // AI Agent
  aiAgent: {
    url: process.env.AI_AGENT_URL || 'http://localhost:8000',
  },

  // Cache TTL in seconds
  cache: {
    searchTTL: 300,       // 5 minutes
    suggestionTTL: 600,   // 10 minutes
    propertyTTL: 3600,    // 1 hour
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
};
