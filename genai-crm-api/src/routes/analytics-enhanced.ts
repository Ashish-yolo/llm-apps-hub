import { Router, Response } from 'express';
import { logger } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { APIResponse, PaginatedResponse } from '../types';
import DashboardAnalyticsService from '../services/dashboardAnalytics';
import MetricsCollectorService from '../services/metricsCollector';
import ReportingService from '../services/reportingService';

const router = Router();

// Initialize services
const dashboardService = new DashboardAnalyticsService();
const metricsService = new MetricsCollectorService();
const reportingService = new ReportingService();

// Apply authentication to all enhanced analytics routes
router.use(authenticateToken);

// Get comprehensive dashboard metrics
router.get('/dashboard/comprehensive', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date as string || new Date().toISOString();
    const agentId = req.query.agent_id as string;

    const metrics = await dashboardService.getDashboardMetrics(startDate, endDate, agentId);

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get comprehensive dashboard metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Dashboard metrics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get customer analytics
router.get('/customer/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.params.id;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const analytics = await dashboardService.getCustomerAnalytics(customerId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get customer analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Customer analytics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get real-time metrics
router.get('/realtime', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metrics = await metricsService.getRealtimeMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get realtime metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Realtime metrics retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get metric history
router.get('/metrics/:name/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metricName = req.params.name;
    const startDate = req.query.start_date as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date as string || new Date().toISOString();
    const granularity = req.query.granularity as 'hour' | 'day' | 'week' || 'day';

    const history = await metricsService.getMetricHistory(metricName, startDate, endDate, granularity);

    res.status(200).json({
      success: true,
      data: {
        metric_name: metricName,
        granularity,
        period: { start_date: startDate, end_date: endDate },
        data_points: history
      },
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get metric history', { error });
    res.status(500).json({
      success: false,
      error: 'Metric history retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Record custom metric
router.post('/metrics/record', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { metric_name, value, dimensions, customer_id } = req.body;
    const userId = req.user!.id;

    await metricsService.recordMetric(
      metric_name,
      value,
      dimensions,
      'custom',
      userId,
      customer_id
    );

    res.status(201).json({
      success: true,
      message: 'Metric recorded successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to record metric', { error });
    res.status(500).json({
      success: false,
      error: 'Metric recording failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Generate executive summary
router.post('/reports/executive-summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, agent_id } = req.body;

    const summary = await reportingService.generateExecutiveSummary(
      start_date,
      end_date,
      agent_id
    );

    res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to generate executive summary', { error });
    res.status(500).json({
      success: false,
      error: 'Executive summary generation failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Generate detailed report
router.post('/reports/detailed', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { report_type, start_date, end_date, filters } = req.body;

    const report = await reportingService.generateDetailedReport(
      report_type,
      start_date,
      end_date,
      filters
    );

    res.status(200).json({
      success: true,
      data: report,
      message: 'Detailed report generated successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to generate detailed report', { error });
    res.status(500).json({
      success: false,
      error: 'Detailed report generation failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Export report
router.post('/reports/:id/export', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reportId = req.params.id;
    const { format, options } = req.body;

    const exportResult = await reportingService.exportReport(reportId, { format, options });

    res.status(200).json({
      success: true,
      data: exportResult,
      message: 'Report exported successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to export report', { error });
    res.status(500).json({
      success: false,
      error: 'Report export failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Schedule report
router.post('/reports/schedule', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reportConfig = {
      ...req.body,
      created_by: req.user!.id
    };

    const reportId = await reportingService.scheduleReport(reportConfig);

    res.status(201).json({
      success: true,
      data: { report_id: reportId },
      message: 'Report scheduled successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to schedule report', { error });
    res.status(500).json({
      success: false,
      error: 'Report scheduling failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get scheduled reports
router.get('/reports/scheduled', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.query.all === 'true' ? undefined : req.user!.id;

    const scheduledReports = await reportingService.getScheduledReports(userId);

    res.status(200).json({
      success: true,
      data: scheduledReports,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get scheduled reports', { error });
    res.status(500).json({
      success: false,
      error: 'Scheduled reports retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Create alert rule
router.post('/alerts/create', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alertRule = req.body;

    const alertId = await metricsService.createAlert(alertRule);

    res.status(201).json({
      success: true,
      data: { alert_id: alertId },
      message: 'Alert rule created successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to create alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Alert rule creation failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Update alert rule
router.put('/alerts/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alertId = req.params.id;
    const updates = req.body;

    await metricsService.updateAlert(alertId, updates);

    res.status(200).json({
      success: true,
      message: 'Alert rule updated successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to update alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Alert rule update failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Delete alert rule
router.delete('/alerts/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alertId = req.params.id;

    await metricsService.deleteAlert(alertId);

    res.status(200).json({
      success: true,
      message: 'Alert rule deleted successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to delete alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Alert rule deletion failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get active alerts
router.get('/alerts/active', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const activeAlerts = await metricsService.getActiveAlerts();

    res.status(200).json({
      success: true,
      data: activeAlerts,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get active alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Active alerts retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get chart data for visualizations
router.get('/charts/:type', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const chartType = req.params.type;
    const startDate = req.query.start_date as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date as string || new Date().toISOString();
    const agentId = req.query.agent_id as string;

    let chartData: any;

    switch (chartType) {
      case 'interaction-trends':
        const metrics = await dashboardService.getDashboardMetrics(startDate, endDate, agentId);
        chartData = {
          type: 'line',
          title: 'Interaction Trends',
          data: metrics.trends.interaction_volume,
          config: {
            xField: 'date',
            yField: 'count',
            smooth: true
          }
        };
        break;

      case 'sentiment-distribution':
        const dashboardMetrics = await dashboardService.getDashboardMetrics(startDate, endDate, agentId);
        chartData = {
          type: 'pie',
          title: 'Sentiment Distribution',
          data: Object.entries(dashboardMetrics.insights.sentiment_distribution).map(([sentiment, count]) => ({
            sentiment,
            count,
            percentage: (count as number / Object.values(dashboardMetrics.insights.sentiment_distribution).reduce((a, b) => a + b, 0)) * 100
          })),
          config: {
            angleField: 'count',
            colorField: 'sentiment'
          }
        };
        break;

      case 'performance-comparison':
        const performanceMetrics = await dashboardService.getDashboardMetrics(startDate, endDate, agentId);
        chartData = {
          type: 'bar',
          title: 'Agent Performance Comparison',
          data: performanceMetrics.performance.top_agents.slice(0, 10),
          config: {
            xField: 'total_interactions',
            yField: 'agent_name',
            seriesField: 'satisfaction_score'
          }
        };
        break;

      case 'ai-usage-heatmap':
        const hourlyData = await metricsService.getMetricHistory('ai_query_processed', startDate, endDate, 'hour');
        chartData = {
          type: 'heatmap',
          title: 'AI Usage Heatmap',
          data: hourlyData,
          config: {
            xField: 'hour',
            yField: 'day',
            colorField: 'value'
          }
        };
        break;

      default:
        res.status(400).json({
          success: false,
          error: 'Unknown chart type',
          timestamp: new Date().toISOString()
        } as APIResponse);
        return;
    }

    res.status(200).json({
      success: true,
      data: chartData,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get chart data', { error });
    res.status(500).json({
      success: false,
      error: 'Chart data retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get data visualization configurations
router.get('/visualizations/config', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const visualizationConfigs = {
      dashboard_widgets: [
        {
          id: 'total-customers',
          type: 'metric',
          title: 'Total Customers',
          metric: 'customer_count',
          format: 'number'
        },
        {
          id: 'satisfaction-score',
          type: 'metric',
          title: 'Satisfaction Score',
          metric: 'avg_satisfaction',
          format: 'decimal',
          suffix: '/5.0'
        },
        {
          id: 'interaction-trends',
          type: 'line-chart',
          title: 'Interaction Trends',
          metric: 'interactions_over_time',
          time_range: '30d'
        },
        {
          id: 'sentiment-pie',
          type: 'pie-chart',
          title: 'Sentiment Distribution',
          metric: 'sentiment_breakdown'
        }
      ],
      chart_themes: {
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        success_color: '#10b981',
        warning_color: '#f59e0b',
        danger_color: '#ef4444'
      },
      refresh_intervals: {
        realtime: 5000,   // 5 seconds
        dashboard: 30000, // 30 seconds
        reports: 300000   // 5 minutes
      }
    };

    res.status(200).json({
      success: true,
      data: visualizationConfigs,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    logger.error('Failed to get visualization config', { error });
    res.status(500).json({
      success: false,
      error: 'Visualization config retrieval failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

export default router;