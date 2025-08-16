import { Router, Response } from 'express';
import { anthropic, logger } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateAIQuery, detectAndRedactPII } from '../middleware/validation';
import { APIResponse, AIQueryRequest } from '../types';
import AIService from '../services/ai';
import QualityAssessmentService from '../services/qualityAssessment';
import ConversationMemoryService from '../services/conversationMemory';
import AIAnalyticsService from '../services/aiAnalytics';

const router = Router();

// Initialize services
const aiService = new AIService(anthropic);
const qualityService = new QualityAssessmentService(aiService);
const conversationService = new ConversationMemoryService();
const analyticsService = new AIAnalyticsService();

// Apply authentication to all AI routes
router.use(authenticateToken);

// Process AI query endpoint with enhanced context and quality assessment
router.post(
  '/query',
  detectAndRedactPII,
  validateAIQuery,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { query, context, customer_id }: AIQueryRequest = req.body;
      const userId = req.user!.id;
      
      logger.info('Processing enhanced AI query:', {
        user_id: userId,
        query_length: query.length,
        has_context: !!context,
        customer_id
      });

      // Build enhanced context
      const aiContext = {
        customer: customer_id ? await getCustomerInfo(customer_id) : undefined,
        ...context
      };

      // Process query with AI service
      const aiResponse = await aiService.processQuery(query, aiContext, userId);

      // Assess response quality
      const qualityMetrics = await qualityService.assessResponseQuality(
        query,
        aiResponse.response,
        aiContext
      );

      res.status(200).json({
        success: true,
        data: {
          ...aiResponse,
          quality_metrics: qualityMetrics
        },
        timestamp: new Date().toISOString()
      } as APIResponse);

    } catch (error: any) {
      logger.error('Enhanced AI query processing failed:', {
        user_id: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'AI processing failed',
        message: 'Failed to process your query. Please try again.',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  }
);

// Generate response suggestions for customer interactions
router.post(
  '/suggestions',
  detectAndRedactPII,
  [
    // Custom validation for suggestions endpoint
    ...validateAIQuery.slice(0, -1), // Remove the error handler
    (req: AuthenticatedRequest, res: Response, next: any) => {
      if (!req.body.interaction_type) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'interaction_type is required',
          timestamp: new Date().toISOString()
        } as APIResponse);
      }
      next();
    },
    validateAIQuery[validateAIQuery.length - 1] // Add back the error handler
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { query, context, interaction_type } = req.body;
      
      logger.info('Generating response suggestions:', {
        user_id: req.user?.id,
        interaction_type,
        query_length: query.length
      });

      const prompt = `You are an expert customer service assistant. Generate 3 professional response suggestions for the following customer ${interaction_type}.

Customer Message: ${query}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Please provide 3 different response options:
1. A brief, direct response
2. A detailed, comprehensive response  
3. A empathetic, relationship-focused response

Format your response as a JSON array of objects with 'type' and 'text' fields.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      const processingTime = Date.now() - startTime;

      // Try to parse JSON response, fallback to plain text
      let suggestions;
      try {
        suggestions = JSON.parse(response);
      } catch {
        // Fallback to plain text suggestions
        suggestions = [
          { type: 'direct', text: response.slice(0, 200) + '...' },
          { type: 'detailed', text: response },
          { type: 'empathetic', text: 'Thank you for reaching out. ' + response.slice(0, 150) + '...' }
        ];
      }

      res.status(200).json({
        success: true,
        data: {
          suggestions,
          processing_time_ms: processingTime
        },
        timestamp: new Date().toISOString()
      } as APIResponse);

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Suggestion generation failed:', {
        user_id: req.user?.id,
        error: error.message,
        processing_time_ms: processingTime
      });

      res.status(500).json({
        success: false,
        error: 'Suggestion generation failed',
        message: 'Failed to generate response suggestions. Please try again.',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  }
);

export default router;