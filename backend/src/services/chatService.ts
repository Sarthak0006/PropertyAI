import { ChatHistory, IChatMessage } from '../models/ChatHistory';
import { logger } from '../utils/logger';

export class ChatService {
  /**
   * Fetch chat history for a session
   */
  async getChatHistory(sessionId: string) {
    try {
      let history = await ChatHistory.findOne({ sessionId });
      if (!history) {
        // Return an empty template rather than throwing error
        return { sessionId, messages: [] };
      }
      return history;
    } catch (error) {
      logger.error({ error, sessionId }, 'Error fetching chat history');
      throw new Error('Failed to fetch chat history');
    }
  }

  /**
   * Save a single message to a session's history
   */
  async appendMessage(sessionId: string, message: { role: 'user' | 'assistant'; content: string; propertyIds?: string[] }) {
    try {
      let history = await ChatHistory.findOne({ sessionId });
      if (!history) {
        history = new ChatHistory({ sessionId, messages: [] });
      }

      history.messages.push({
        role: message.role,
        content: message.content,
        timestamp: new Date(),
        propertyIds: message.propertyIds || [],
      });

      await history.save();
      return history;
    } catch (error) {
      logger.error({ error, sessionId }, 'Error appending chat message');
      // Non-fatal, return null
      return null;
    }
  }
}
