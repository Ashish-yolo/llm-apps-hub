import { supabase, logger } from '../server';
import DashboardAnalyticsService from './dashboardAnalytics';
import AIAnalyticsService from './aiAnalytics';

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  report_type: 'performance' | 'customer' | 'ai' | 'business' | 'custom';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    day_of_week?: number; // 0-6 for weekly
    day_of_month?: number; // 1-31 for monthly
    timezone: string;
  };
  recipients: Array<{
    email: string;
    format: 'pdf' | 'excel' | 'json';
  }>;
  filters: Record<string, any>;
  enabled: boolean;
  created_by: string;
  last_run?: string;
  next_run: string;
}

export interface ExportFormat {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  options: {
    include_charts?: boolean;
    page_orientation?: 'portrait' | 'landscape';
    chart_format?: 'png' | 'svg';
    date_format?: string;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: Array<{
    title: string;
    type: 'metrics' | 'chart' | 'table' | 'text';
    config: any;
    data_source: string;
  }>;
  layout: {
    page_size: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  };
  styling: {
    font_family: string;
    primary_color: string;
    accent_color: string;
    logo_url?: string;
  };
}

export class ReportingService {
  private dashboardService: DashboardAnalyticsService;
  private aiAnalyticsService: AIAnalyticsService;

  constructor() {
    this.dashboardService = new DashboardAnalyticsService();
    this.aiAnalyticsService = new AIAnalyticsService();
  }

  async generateExecutiveSummary(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<{
    summary: string;
    key_metrics: Record<string, number>;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      logger.info('Generating executive summary', { startDate, endDate, agentId });

      // Get comprehensive data
      const [dashboardMetrics, aiMetrics] = await Promise.all([
        this.dashboardService.getDashboardMetrics(startDate, endDate, agentId),
        this.aiAnalyticsService.getPerformanceMetrics(startDate, endDate, agentId)
      ]);

      // Calculate key metrics
      const keyMetrics = {
        total_customers: dashboardMetrics.overview.total_customers,
        total_interactions: dashboardMetrics.overview.total_interactions,
        customer_satisfaction: dashboardMetrics.overview.customer_satisfaction,
        ai_queries_processed: aiMetrics.total_queries,
        avg_ai_confidence: aiMetrics.avg_confidence_score,
        resolution_rate: dashboardMetrics.overview.resolution_rate,
        escalation_rate: dashboardMetrics.insights.escalation_rate
      };

      // Generate insights
      const insights = this.generateInsights(dashboardMetrics, aiMetrics);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(dashboardMetrics, aiMetrics);

      // Create executive summary text
      const summary = this.createExecutiveSummaryText(keyMetrics, insights);

      return {
        summary,
        key_metrics: keyMetrics,
        insights,
        recommendations
      };

    } catch (error) {
      logger.error('Failed to generate executive summary', { error });
      throw error;
    }
  }

  async generateDetailedReport(
    reportType: 'performance' | 'customer' | 'ai' | 'business',
    startDate: string,
    endDate: string,
    filters: Record<string, any> = {}
  ): Promise<{
    report_id: string;
    title: string;
    sections: Array<{
      title: string;
      content: any;
      charts: any[];
    }>;
    metadata: {
      generated_at: string;
      period: string;
      total_pages: number;
    };
  }> {
    try {
      const reportId = `detailed_${reportType}_${Date.now()}`;
      
      let sections: any[] = [];

      switch (reportType) {
        case 'performance':
          sections = await this.generatePerformanceSections(startDate, endDate, filters);
          break;
        case 'customer':
          sections = await this.generateCustomerSections(startDate, endDate, filters);
          break;
        case 'ai':
          sections = await this.generateAISections(startDate, endDate, filters);
          break;
        case 'business':
          sections = await this.generateBusinessSections(startDate, endDate, filters);
          break;
      }

      const report = {
        report_id: reportId,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        sections,
        metadata: {
          generated_at: new Date().toISOString(),
          period: `${startDate} to ${endDate}`,
          total_pages: Math.ceil(sections.length / 3) // Estimate
        }
      };

      // Store report
      await this.storeGeneratedReport(report);

      return report;

    } catch (error) {
      logger.error('Failed to generate detailed report', { error, reportType });
      throw error;
    }
  }

  async exportReport(
    reportId: string,
    format: ExportFormat
  ): Promise<{
    download_url: string;
    file_size: number;
    expires_at: string;
  }> {
    try {
      logger.info('Exporting report', { reportId, format: format.format });

      // Get report data
      const { data: reportData, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('report_id', reportId)
        .single();

      if (error || !reportData) {
        throw new Error(`Report ${reportId} not found`);
      }

      // Generate export file based on format
      let exportResult: any;

      switch (format.format) {
        case 'pdf':
          exportResult = await this.exportToPDF(reportData, format.options);
          break;
        case 'excel':
          exportResult = await this.exportToExcel(reportData, format.options);
          break;
        case 'csv':
          exportResult = await this.exportToCSV(reportData, format.options);
          break;
        case 'json':
          exportResult = await this.exportToJSON(reportData, format.options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format.format}`);
      }

      // Store export info
      await this.recordExport(reportId, format.format, exportResult.file_size);

      return {
        download_url: exportResult.download_url,
        file_size: exportResult.file_size,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

    } catch (error) {
      logger.error('Failed to export report', { error, reportId });
      throw error;
    }
  }

  async scheduleReport(reportConfig: Omit<ScheduledReport, 'id' | 'next_run'>): Promise<string> {
    try {
      const reportId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const nextRun = this.calculateNextRun(reportConfig.schedule);
      
      const scheduledReport: ScheduledReport = {
        id: reportId,
        ...reportConfig,
        next_run: nextRun
      };

      // Store in database
      await supabase
        .from('scheduled_reports')
        .insert({
          report_id: reportId,
          name: scheduledReport.name,
          description: scheduledReport.description,
          report_type: scheduledReport.report_type,
          schedule: scheduledReport.schedule,
          recipients: scheduledReport.recipients,
          filters: scheduledReport.filters,
          enabled: scheduledReport.enabled,
          created_by: scheduledReport.created_by,
          next_run: scheduledReport.next_run
        });

      logger.info('Report scheduled', { reportId, nextRun });

      return reportId;

    } catch (error) {
      logger.error('Failed to schedule report', { error });
      throw error;
    }
  }

  async getScheduledReports(userId?: string): Promise<ScheduledReport[]> {
    try {
      let query = supabase
        .from('scheduled_reports')
        .select('*')
        .eq('enabled', true);

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query.order('next_run', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(row => ({
        id: row.report_id,
        name: row.name,
        description: row.description,
        report_type: row.report_type,
        schedule: row.schedule,
        recipients: row.recipients,
        filters: row.filters,
        enabled: row.enabled,
        created_by: row.created_by,
        last_run: row.last_run,
        next_run: row.next_run
      }));

    } catch (error) {
      logger.error('Failed to get scheduled reports', { error });
      return [];
    }
  }

  async executeScheduledReport(reportId: string): Promise<void> {
    try {
      const { data: reportConfig, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('report_id', reportId)
        .single();

      if (error || !reportConfig) {
        throw new Error(`Scheduled report ${reportId} not found`);
      }

      // Calculate date range based on frequency
      const { startDate, endDate } = this.getDateRangeForSchedule(reportConfig.schedule);

      // Generate report
      const report = await this.generateDetailedReport(
        reportConfig.report_type,
        startDate,
        endDate,
        reportConfig.filters
      );

      // Export and send to recipients
      for (const recipient of reportConfig.recipients) {
        try {
          const exportResult = await this.exportReport(report.report_id, {
            format: recipient.format,
            options: {}
          });

          // Send email with report (placeholder)
          await this.sendReportEmail(recipient.email, report, exportResult);

        } catch (error) {
          logger.error('Failed to send report to recipient', { 
            error, 
            reportId, 
            recipient: recipient.email 
          });
        }
      }

      // Update schedule
      const nextRun = this.calculateNextRun(reportConfig.schedule);
      await supabase
        .from('scheduled_reports')
        .update({
          last_run: new Date().toISOString(),
          next_run: nextRun
        })
        .eq('report_id', reportId);

      logger.info('Scheduled report executed', { reportId, nextRun });

    } catch (error) {
      logger.error('Failed to execute scheduled report', { error, reportId });
      throw error;
    }
  }

  async createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<string> {
    try {
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const reportTemplate: ReportTemplate = {
        id: templateId,
        ...template
      };

      await supabase
        .from('report_templates')
        .insert({
          template_id: templateId,
          name: template.name,
          description: template.description,
          sections: template.sections,
          layout: template.layout,
          styling: template.styling
        });

      logger.info('Report template created', { templateId });

      return templateId;

    } catch (error) {
      logger.error('Failed to create report template', { error });
      throw error;
    }
  }

  private generateInsights(dashboardMetrics: any, aiMetrics: any): string[] {
    const insights: string[] = [];

    // Customer satisfaction insights
    if (dashboardMetrics.overview.customer_satisfaction > 4.0) {
      insights.push(`High customer satisfaction score of ${dashboardMetrics.overview.customer_satisfaction.toFixed(1)}/5.0`);
    } else if (dashboardMetrics.overview.customer_satisfaction < 3.0) {
      insights.push(`Customer satisfaction needs attention at ${dashboardMetrics.overview.customer_satisfaction.toFixed(1)}/5.0`);
    }

    // AI performance insights
    if (aiMetrics.avg_confidence_score > 0.8) {
      insights.push(`AI responses show high confidence with ${(aiMetrics.avg_confidence_score * 100).toFixed(1)}% average`);
    }

    // Volume insights
    if (dashboardMetrics.overview.total_interactions > 1000) {
      insights.push(`High interaction volume with ${dashboardMetrics.overview.total_interactions} interactions processed`);
    }

    // Efficiency insights
    if (dashboardMetrics.overview.avg_response_time < 2000) {
      insights.push(`Excellent response times averaging ${dashboardMetrics.overview.avg_response_time}ms`);
    }

    return insights;
  }

  private generateRecommendations(dashboardMetrics: any, aiMetrics: any): string[] {
    const recommendations: string[] = [];

    if (dashboardMetrics.overview.customer_satisfaction < 3.5) {
      recommendations.push('Focus on improving response quality and customer communication');
    }

    if (aiMetrics.avg_confidence_score < 0.7) {
      recommendations.push('Review and enhance AI prompt templates for better response quality');
    }

    if (dashboardMetrics.insights.escalation_rate > 0.15) {
      recommendations.push('Implement proactive customer service training to reduce escalations');
    }

    if (dashboardMetrics.overview.avg_response_time > 3000) {
      recommendations.push('Optimize AI processing pipeline to improve response times');
    }

    return recommendations;
  }

  private createExecutiveSummaryText(keyMetrics: any, insights: string[]): string {
    return `
Executive Summary

During this reporting period, our customer service operations processed ${keyMetrics.total_interactions} interactions across ${keyMetrics.total_customers} customers. Our AI assistance system handled ${keyMetrics.ai_queries_processed} queries with an average confidence score of ${(keyMetrics.avg_ai_confidence * 100).toFixed(1)}%.

Key Performance Indicators:
• Customer Satisfaction: ${keyMetrics.customer_satisfaction.toFixed(1)}/5.0
• Resolution Rate: ${(keyMetrics.resolution_rate * 100).toFixed(1)}%
• Escalation Rate: ${(keyMetrics.escalation_rate * 100).toFixed(1)}%

Key Insights:
${insights.map(insight => `• ${insight}`).join('\n')}

The data indicates strong operational performance with opportunities for continued improvement in customer satisfaction and AI assistance optimization.
    `.trim();
  }

  private async generatePerformanceSections(startDate: string, endDate: string, filters: any): Promise<any[]> {
    const metrics = await this.dashboardService.getDashboardMetrics(startDate, endDate);
    
    return [
      {
        title: 'Performance Overview',
        content: metrics.overview,
        charts: [
          {
            type: 'line',
            title: 'Performance Trends',
            data: metrics.trends
          }
        ]
      },
      {
        title: 'Agent Performance',
        content: metrics.performance.top_agents,
        charts: [
          {
            type: 'bar',
            title: 'Top Performing Agents',
            data: metrics.performance.top_agents
          }
        ]
      }
    ];
  }

  private async generateCustomerSections(startDate: string, endDate: string, filters: any): Promise<any[]> {
    // Implementation for customer sections
    return [
      {
        title: 'Customer Analytics',
        content: { summary: 'Customer analytics data' },
        charts: []
      }
    ];
  }

  private async generateAISections(startDate: string, endDate: string, filters: any): Promise<any[]> {
    const aiMetrics = await this.aiAnalyticsService.getPerformanceMetrics(startDate, endDate);
    
    return [
      {
        title: 'AI Performance Overview',
        content: aiMetrics,
        charts: [
          {
            type: 'area',
            title: 'AI Usage Over Time',
            data: aiMetrics
          }
        ]
      }
    ];
  }

  private async generateBusinessSections(startDate: string, endDate: string, filters: any): Promise<any[]> {
    // Implementation for business sections
    return [
      {
        title: 'Business Metrics',
        content: { summary: 'Business intelligence data' },
        charts: []
      }
    ];
  }

  private async exportToPDF(reportData: any, options: any): Promise<{ download_url: string; file_size: number }> {
    // PDF export implementation (placeholder)
    return {
      download_url: '/exports/report.pdf',
      file_size: 1024000
    };
  }

  private async exportToExcel(reportData: any, options: any): Promise<{ download_url: string; file_size: number }> {
    // Excel export implementation (placeholder)
    return {
      download_url: '/exports/report.xlsx',
      file_size: 512000
    };
  }

  private async exportToCSV(reportData: any, options: any): Promise<{ download_url: string; file_size: number }> {
    // CSV export implementation (placeholder)
    return {
      download_url: '/exports/report.csv',
      file_size: 256000
    };
  }

  private async exportToJSON(reportData: any, options: any): Promise<{ download_url: string; file_size: number }> {
    // JSON export implementation
    const jsonData = JSON.stringify(reportData, null, 2);
    return {
      download_url: '/exports/report.json',
      file_size: Buffer.byteLength(jsonData, 'utf8')
    };
  }

  private calculateNextRun(schedule: ScheduledReport['schedule']): string {
    const now = new Date();
    const nextRun = new Date();

    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilNext = (7 + (schedule.day_of_week || 0) - now.getDay()) % 7;
        nextRun.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(schedule.day_of_month || 1);
        break;
    }

    const [hour, minute] = schedule.time.split(':').map(Number);
    nextRun.setHours(hour, minute, 0, 0);

    return nextRun.toISOString();
  }

  private getDateRangeForSchedule(schedule: ScheduledReport['schedule']): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;

    switch (schedule.frequency) {
      case 'daily':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = yesterday.toISOString();
        break;
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
        break;
      case 'monthly':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        startDate = monthAgo.toISOString();
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }

    return { startDate, endDate };
  }

  private async storeGeneratedReport(report: any): Promise<void> {
    try {
      await supabase
        .from('generated_reports')
        .insert({
          report_id: report.report_id,
          title: report.title,
          data: report,
          generated_at: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('Failed to store generated report', { error });
    }
  }

  private async recordExport(reportId: string, format: string, fileSize: number): Promise<void> {
    try {
      await supabase
        .from('report_exports')
        .insert({
          report_id: reportId,
          format,
          file_size: fileSize,
          exported_at: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('Failed to record export', { error });
    }
  }

  private async sendReportEmail(email: string, report: any, exportResult: any): Promise<void> {
    // Email sending implementation (placeholder)
    logger.info('Report email sent', { email, reportId: report.report_id });
  }
}

export default ReportingService;