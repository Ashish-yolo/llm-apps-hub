import { Router, Response } from 'express';
import { supabase, logger } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateAnalyticsQuery } from '../middleware/validation';
import { APIResponse, PaginatedResponse } from '../types';

const router = Router();

// Apply authentication to all analytics routes
router.use(authenticateToken);

// Get analytics dashboard data
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Get date range from query params (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateStr = req.query.start_date as string || startDate.toISOString().split('T')[0];
    const endDateStr = req.query.end_date as string || endDate.toISOString().split('T')[0];

    logger.info('Fetching dashboard analytics:', {
      user_id: userId,
      start_date: startDateStr,
      end_date: endDateStr
    });

    // Fetch key metrics
    const [
      totalInteractions,
      aiQueriesProcessed,
      avgResponseTime,
      sentimentAnalysis
    ] = await Promise.all([
      // Total interactions count
      supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr + 'T23:59:59'),

      // AI queries processed count  
      supabase
        .from('ai_responses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr + 'T23:59:59'),

      // Average response time
      supabase
        .from('ai_responses')
        .select('processing_time_ms')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr + 'T23:59:59'),

      // Sentiment analysis
      supabase
        .from('interactions')
        .select('sentiment')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr + 'T23:59:59')
        .not('sentiment', 'is', null)
    ]);

    // Calculate average response time
    const avgTime = avgResponseTime.data?.length 
      ? avgResponseTime.data.reduce((sum, item) => sum + (item.processing_time_ms || 0), 0) / avgResponseTime.data.length
      : 0;

    // Calculate sentiment distribution
    const sentimentCounts = sentimentAnalysis.data?.reduce((acc, item) => {
      const sentiment = item.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const dashboardData = {
      metrics: {
        total_interactions: totalInteractions.count || 0,
        ai_queries_processed: aiQueriesProcessed.count || 0,
        avg_response_time_ms: Math.round(avgTime),
        sentiment_distribution: sentimentCounts
      },
      date_range: {
        start_date: startDateStr,
        end_date: endDateStr
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      message: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get interaction analytics
router.get('/interactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = (page - 1) * limit;

    const type = req.query.type as string;
    const sentiment = req.query.sentiment as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    let query = supabase
      .from('interactions')
      .select(`
        id,
        customer_id,
        type,
        sentiment,
        created_at,
        customers!inner(name, email)
      `, { count: 'exact' });

    // Apply filters
    if (type) query = query.eq('type', type);
    if (sentiment) query = query.eq('sentiment', sentiment);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Interactions analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Database query failed',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      },
      timestamp: new Date().toISOString()
    } as PaginatedResponse);

  } catch (error) {
    logger.error('Interactions analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get AI performance analytics
router.get('/ai-performance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    let query = supabase
      .from('ai_responses')
      .select('processing_time_ms, confidence_score, created_at');

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      logger.error('AI performance analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Database query failed',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    // Calculate performance metrics
    const responses = data || [];
    const performanceData = {
      total_queries: responses.length,
      avg_processing_time: responses.length 
        ? responses.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / responses.length
        : 0,
      avg_confidence: responses.length 
        ? responses.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / responses.length
        : 0,
      time_series: responses.map(r => ({
        date: r.created_at,
        processing_time: r.processing_time_ms,
        confidence: r.confidence_score
      }))
    };

    res.status(200).json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('AI performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Export analytics data
router.post('/export', validateAnalyticsQuery, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, metrics, filters } = req.body;
    
    logger.info('Exporting analytics data:', {
      user_id: req.user?.id,
      start_date,
      end_date,
      metrics
    });

    // This is a simplified export - in production you might want to:
    // 1. Queue this as a background job for large datasets
    // 2. Generate and upload to cloud storage
    // 3. Email download link to user
    
    const exportData = {
      export_id: `export_${Date.now()}`,
      status: 'processing',
      download_url: null,
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };

    res.status(202).json({
      success: true,
      data: exportData,
      message: 'Export request queued successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Analytics export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

export default router;