import { Router, Response } from 'express';
import { supabase, logger } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateAIQuery } from '../middleware/validation';
import { APIResponse } from '../types';
import AIService from '../services/ai';
import QualityAssessmentService from '../services/qualityAssessment';
import ConversationMemoryService from '../services/conversationMemory';
import AIAnalyticsService from '../services/aiAnalytics';

const router = Router();

// Apply authentication to all enhanced AI routes
router.use(authenticateToken);

// Get AI performance analytics
router.get('/analytics/performance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date as string || new Date().toISOString();
    const userId = req.query.user_id as string;

    const analyticsService = new AIAnalyticsService();
    const metrics = await analyticsService.getPerformanceMetrics(startDate, endDate, userId);

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get AI performance analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get AI usage analytics
router.get('/analytics/usage', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date as string || new Date().toISOString();

    const analyticsService = new AIAnalyticsService();
    const usage = await analyticsService.getUsageAnalytics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: usage,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get AI usage analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Start a conversation
router.post('/conversation/start', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customer_id, initial_message } = req.body;
    const agentId = req.user!.id;

    const conversationService = new ConversationMemoryService();
    const conversationId = await conversationService.startConversation(
      customer_id,
      agentId,
      initial_message
    );

    res.status(201).json({
      success: true,
      data: {
        conversation_id: conversationId
      },
      message: 'Conversation started successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to start conversation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Add conversation turn
router.post('/conversation/:id/turn', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const { role, content, metadata } = req.body;

    const conversationService = new ConversationMemoryService();
    await conversationService.addConversationTurn(conversationId, role, content, metadata);

    res.status(200).json({
      success: true,
      message: 'Conversation turn added successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to add conversation turn', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to add conversation turn',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get conversation context
router.get('/conversation/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const maxTurns = parseInt(req.query.max_turns as string) || 20;

    const conversationService = new ConversationMemoryService();
    const context = await conversationService.getConversationContext(conversationId);

    if (!context) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    // Limit turns for performance
    const limitedContext = {
      ...context,
      turns: context.turns.slice(-maxTurns)
    };

    res.status(200).json({
      success: true,
      data: limitedContext,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get conversation context', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation context',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Close conversation
router.post('/conversation/:id/close', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const { status, summary } = req.body;

    const conversationService = new ConversationMemoryService();
    await conversationService.closeConversation(conversationId, status, summary);

    res.status(200).json({
      success: true,
      message: 'Conversation closed successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to close conversation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to close conversation',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Assess response quality
router.post('/quality/assess', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { original_query, response, customer_context } = req.body;

    const qualityService = new QualityAssessmentService(new AIService(require('../server').anthropic));
    const qualityMetrics = await qualityService.assessResponseQuality(
      original_query,
      response,
      customer_context
    );

    res.status(200).json({
      success: true,
      data: qualityMetrics,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to assess response quality', { error });
    res.status(500).json({
      success: false,
      error: 'Quality assessment failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Detect escalation needs
router.post('/escalation/detect', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { query, customer_context } = req.body;

    const qualityService = new QualityAssessmentService(new AIService(require('../server').anthropic));
    const escalationAnalysis = await qualityService.detectEscalationNeeds(query, customer_context);

    res.status(200).json({
      success: true,
      data: escalationAnalysis,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to detect escalation needs', { error });
    res.status(500).json({
      success: false,
      error: 'Escalation detection failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Generate AI insights
router.get('/insights', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date as string || new Date().toISOString();

    const analyticsService = new AIAnalyticsService();
    const insights = await analyticsService.generateAIInsights(startDate, endDate);

    res.status(200).json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to generate AI insights', { error });
    res.status(500).json({
      success: false,
      error: 'Insights generation failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get active conversations for agent
router.get('/conversations/active', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const agentId = req.user!.id;

    const conversationService = new ConversationMemoryService();
    const activeConversations = await conversationService.getActiveConversations(agentId);

    res.status(200).json({
      success: true,
      data: activeConversations,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get active conversations', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get active conversations',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Search conversation history
router.post('/conversations/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customer_id, query, limit } = req.body;

    const conversationService = new ConversationMemoryService();
    const searchResults = await conversationService.searchConversationHistory(
      customer_id,
      query,
      limit
    );

    res.status(200).json({
      success: true,
      data: searchResults,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to search conversation history', { error });
    res.status(500).json({
      success: false,
      error: 'Conversation search failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Helper function to get customer info
async function getCustomerInfo(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logger.warn('Failed to get customer info', { error, customerId });
    return null;
  }
}

export default router;