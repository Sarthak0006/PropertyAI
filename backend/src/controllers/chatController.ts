import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { SearchService } from '../services/searchService';
import axios from 'axios';
import { config } from '../config';

const chatService = new ChatService();
const searchService = new SearchService();
const AI_AGENT_URL = config.aiAgent.url;

export class ChatController {
  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const history = await chatService.getChatHistory(sessionId);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };

  // streamChat = async (req: Request, res: Response, next: NextFunction) => {
  //   const { sessionId, message } = req.body;

  //   if (!sessionId || !message) {
  //     res.status(400).json({ success: false, error: 'sessionId and message are required' });
  //     return;
  //   }

  //   try {
  //     // 1. Save user message to MongoDB
  //     // await chatService.appendMessage(sessionId, { role: 'user', content: message });

  //     // 2. Setup Server-Sent Events (SSE) Headers
  //     res.setHeader('Content-Type', 'text/event-stream');
  //     res.setHeader('Cache-Control', 'no-cache');
  //     res.setHeader('Connection', 'keep-alive');
  //     res.flushHeaders();

  //     // 3. Search Elasticsearch to find matching properties
  //     // By passing the query, it auto-contacts the AI Agent to get filters/embeddings
  //     const searchResult = await searchService.search({
  //       q: message,
  //       page: 1,
  //       limit: 5,
  //       sort: 'relevance',
  //     });

  //     // 4. Extract Top N attributes to summarize
  //     const topN = searchResult.properties.slice(0, 3);
  //     const propertyIds = topN.map((p: any) => String(p.id));
  //     const propertiesJson = topN.map((p: any) => ({
  //       id: p.id,
  //       title: p.title,
  //       price: p.price,
  //       location: p.location,
  //       bedrooms: p.bedrooms,
  //       bathrooms: p.bathrooms,
  //       size_sqft: p.size_sqft,
  //       // property_type: p.property_type,
  //       amenities: p.amenities,
  //       image_url: p.image_url,
  //     }));

  //     console.log("Search", searchResult.properties);

  //     res.write(`data: ${JSON.stringify({
  //       type: "properties",
  //       properties: propertiesJson
  //     })}\n\n`);

  //     // 5. Connect to Python AI Agent for streamed summarization
  //     // We pass the user query + JSON of the top results
  //     let fullAssistantMessage = '';

  //     try {
  //       const response = await axios({
  //         method: 'post',
  //         url: `${AI_AGENT_URL}/api/v1/chat/stream`,
  //         data: {
  //           query: message,
  //           properties: propertiesJson,
  //         },
  //         responseType: 'stream',
  //       });

  //       response.data.on('data', (chunk: Buffer) => {
  //         const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');
  //         for (const line of lines) {
  //           if (line.startsWith('data: ')) {
  //             const content = line.replace('data: ', '');
  //             if (content !== '[DONE]') {
  //               try {
  //                 const parsed = JSON.parse(content);
  //                 if (parsed.text) {
  //                   fullAssistantMessage += parsed.text;
  //                   res.write(`data: ${JSON.stringify({ text: parsed.text })}\n\n`);
  //                 }
  //               } catch (e) {
  //                 // Ignore parse errors on partial chunks
  //               }
  //             }
  //           }
  //         }
  //       });

  //       response.data.on('end', async () => {
  //         // Send properties payload
  //         res.write(`data: ${JSON.stringify({ properties: propertiesJson })}\n\n`);

  //         // 6. Save final assistant message to ChatHistory
  //         // await chatService.appendMessage(sessionId, {
  //         //   role: 'assistant',
  //         //   content: fullAssistantMessage,
  //         //   propertyIds,
  //         // });

  //         res.write(`data: [DONE]\n\n`);
  //         res.end();
  //       });

  //     } catch (aiError: any) {
  //       console.error('AI Agent Stream Error:', aiError.message);
  //       const fallbackMsg = `Quota limit exceeded for the AI summarization. However, I found ${searchResult.total} properties matching your criteria. You can view the top matching property cards below.`;

  //       // await chatService.appendMessage(sessionId, {
  //       //   role: 'assistant',
  //       //   content: fallbackMsg,
  //       //   propertyIds,
  //       // });

  //       res.write(`data: ${JSON.stringify({ text: fallbackMsg })}\n\n`);
  //       res.write(`data: ${JSON.stringify({ properties: propertiesJson })}\n\n`);
  //       res.write(`data: [DONE]\n\n`);
  //       res.end();
  //     }

  //   } catch (error) {
  //     console.error('Chat controller error:', error);
  //     res.status(500).end();
  //   }
  // };

  streamChat = async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      res.status(400).json({ success: false, error: 'sessionId and message are required' });
      return;
    }

    try {
      // SSE setup
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // 1. Elasticsearch Search
      const searchResult = await searchService.search({
        q: message,
        page: 1,
        limit: 5,
        sort: 'relevance',
      });

      const topN = searchResult.properties.slice(0, 3);

      const propertiesJson = topN.map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        size_sqft: p.size_sqft,
        amenities: p.amenities,
        image_url: p.image_url,
      }));

      // 🚀 SEND PROPERTIES IMMEDIATELY
      res.write(
        `data: ${JSON.stringify({
          type: "properties",
          properties: propertiesJson
        })}\n\n`
      );

      // 2. Start AI summarization AFTER properties are sent
      let fullAssistantMessage = '';

      const response = await axios({
        method: 'post',
        url: `${AI_AGENT_URL}/api/v1/chat/stream`,
        data: {
          query: message,
          properties: propertiesJson,
        },
        responseType: 'stream',
      });

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.replace('data: ', '');

            if (content !== '[DONE]') {
              try {
                const parsed = JSON.parse(content);

                if (parsed.text) {
                  fullAssistantMessage += parsed.text;

                  res.write(
                    `data: ${JSON.stringify({ text: parsed.text })}\n\n`
                  );
                }
              } catch { }
            }
          }
        }
      });

      response.data.on('end', () => {
        res.write(`data: [DONE]\n\n`);
        res.end();
      });

    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).end();
    }
  };
}
