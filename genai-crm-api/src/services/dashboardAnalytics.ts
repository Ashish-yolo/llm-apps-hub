import { supabase, logger } from '../server';

export interface DashboardMetrics {
  overview: {
    total_customers: number;
    total_interactions: number;
    total_ai_queries: number;
    avg_response_time: number;
    customer_satisfaction: number;
    resolution_rate: number;
  };
  trends: {
    customer_growth: Array<{ date: string; count: number }>;
    interaction_volume: Array<{ date: string; count: number }>;
    ai_usage: Array<{ date: string; count: number }>;
    satisfaction_trend: Array<{ date: string; score: number }>;
  };
  performance: {
    top_agents: Array<{
      agent_id: string;
      agent_name: string;
      total_interactions: number;
      avg_response_time: number;
      satisfaction_score: number;
      resolution_rate: number;
    }>;
    ai_metrics: {
      total_queries: number;
      avg_confidence: number;
      cache_hit_rate: number;
      error_rate: number;
    };
  };
  insights: {
    peak_hours: Array<{ hour: number; interaction_count: number }>;
    popular_channels: Array<{ channel: string; count: number; percentage: number }>;
    sentiment_distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    escalation_rate: number;
  };
}

export interface CustomerAnalytics {
  customer_lifetime_value: number;
  interaction_frequency: number;
  satisfaction_score: number;
  issue_resolution_time: number;
  preferred_channels: string[];
  interaction_history: Array<{
    date: string;
    type: string;
    sentiment: string;
    resolved: boolean;
  }>;
  ai_assistance_usage: {
    total_queries: number;
    avg_confidence: number;
    most_common_intents: string[];
  };
}

export interface ReportData {
  report_id: string;
  report_type: 'performance' | 'customer' | 'ai' | 'business';
  title: string;
  description: string;
  data: any;
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    title: string;
    data: any;
    config: any;
  }>;
  generated_at: string;
  period: {
    start_date: string;
    end_date: string;
  };
}

export class DashboardAnalyticsService {
  async getDashboardMetrics(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<DashboardMetrics> {
    try {
      logger.info('Generating dashboard metrics', { startDate, endDate, agentId });

      // Run all queries in parallel for better performance
      const [
        overviewData,
        trendsData,
        performanceData,
        insightsData
      ] = await Promise.all([
        this.getOverviewMetrics(startDate, endDate, agentId),
        this.getTrendsData(startDate, endDate, agentId),
        this.getPerformanceData(startDate, endDate, agentId),
        this.getInsightsData(startDate, endDate, agentId)
      ]);

      return {
        overview: overviewData,
        trends: trendsData,
        performance: performanceData,
        insights: insightsData
      };

    } catch (error) {
      logger.error('Failed to generate dashboard metrics', { error });
      throw error;
    }
  }

  async getCustomerAnalytics(
    customerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CustomerAnalytics> {
    try {
      const end = endDate || new Date().toISOString();
      const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      // Get customer interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('customer_id', customerId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (interactionsError) throw interactionsError;

      // Get AI responses for this customer
      const { data: aiResponses, error: aiError } = await supabase
        .from('ai_responses')
        .select('*')
        .eq('customer_id', customerId)
        .gte('created_at', start)
        .lte('created_at', end);

      if (aiError) throw aiError;

      // Calculate metrics
      const totalInteractions = interactions?.length || 0;
      const avgSatisfaction = this.calculateSatisfactionScore(interactions || []);
      const interactionFrequency = totalInteractions / 90; // per day over 3 months
      
      // Calculate CLV (simplified)
      const clv = this.calculateCustomerLifetimeValue(interactions || []);

      // Calculate resolution time
      const avgResolutionTime = this.calculateAverageResolutionTime(interactions || []);

      // Get preferred channels
      const channelCounts = (interactions || []).reduce((acc, interaction) => {
        const channel = interaction.type;
        acc[channel] = (acc[channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const preferredChannels = Object.entries(channelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([channel]) => channel);

      // Interaction history
      const interactionHistory = (interactions || []).slice(0, 20).map(interaction => ({
        date: interaction.created_at.split('T')[0],
        type: interaction.type,
        sentiment: interaction.sentiment || 'neutral',
        resolved: true // Simplified - could track actual resolution
      }));

      // AI assistance metrics
      const aiMetrics = {
        total_queries: aiResponses?.length || 0,
        avg_confidence: aiResponses?.length 
          ? aiResponses.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / aiResponses.length
          : 0,
        most_common_intents: this.getMostCommonIntents(aiResponses || [])
      };

      return {
        customer_lifetime_value: clv,
        interaction_frequency: Math.round(interactionFrequency * 100) / 100,
        satisfaction_score: avgSatisfaction,
        issue_resolution_time: avgResolutionTime,
        preferred_channels: preferredChannels,
        interaction_history: interactionHistory,
        ai_assistance_usage: aiMetrics
      };

    } catch (error) {
      logger.error('Failed to get customer analytics', { error, customerId });
      throw error;
    }
  }

  async generateReport(
    reportType: 'performance' | 'customer' | 'ai' | 'business',
    startDate: string,
    endDate: string,
    filters: Record<string, any> = {}
  ): Promise<ReportData> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let reportData: any;
      let charts: any[] = [];

      switch (reportType) {
        case 'performance':
          reportData = await this.generatePerformanceReport(startDate, endDate, filters);
          charts = await this.generatePerformanceCharts(reportData);
          break;

        case 'customer':
          reportData = await this.generateCustomerReport(startDate, endDate, filters);
          charts = await this.generateCustomerCharts(reportData);
          break;

        case 'ai':
          reportData = await this.generateAIReport(startDate, endDate, filters);
          charts = await this.generateAICharts(reportData);
          break;

        case 'business':
          reportData = await this.generateBusinessReport(startDate, endDate, filters);
          charts = await this.generateBusinessCharts(reportData);
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      const report: ReportData = {
        report_id: reportId,
        report_type: reportType,
        title: this.getReportTitle(reportType),
        description: this.getReportDescription(reportType, startDate, endDate),
        data: reportData,
        charts: charts,
        generated_at: new Date().toISOString(),
        period: {
          start_date: startDate,
          end_date: endDate
        }
      };

      // Store report for future access
      await this.storeReport(report);

      return report;

    } catch (error) {
      logger.error('Failed to generate report', { error, reportType });
      throw error;
    }
  }

  private async getOverviewMetrics(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<DashboardMetrics['overview']> {
    const queries = [];

    // Build base query with optional agent filter
    let customerQuery = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    let interactionQuery = supabase
      .from('interactions')
      .select('processing_time_ms, sentiment', { count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    let aiQuery = supabase
      .from('ai_responses')
      .select('processing_time_ms', { count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (agentId) {
      interactionQuery = interactionQuery.eq('agent_id', agentId);
      aiQuery = aiQuery.eq('user_id', agentId);
    }

    const [
      { count: totalCustomers },
      { data: interactions, count: totalInteractions },
      { data: aiResponses, count: totalAiQueries }
    ] = await Promise.all([
      customerQuery,
      interactionQuery,
      aiQuery
    ]);

    // Calculate metrics
    const avgResponseTime = aiResponses?.length 
      ? aiResponses.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / aiResponses.length
      : 0;

    const satisfactionScore = this.calculateSatisfactionScore(interactions || []);
    const resolutionRate = 0.85; // Placeholder - would need resolution tracking

    return {
      total_customers: totalCustomers || 0,
      total_interactions: totalInteractions || 0,
      total_ai_queries: totalAiQueries || 0,
      avg_response_time: Math.round(avgResponseTime),
      customer_satisfaction: satisfactionScore,
      resolution_rate: resolutionRate
    };
  }

  private async getTrendsData(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<DashboardMetrics['trends']> {
    // Get daily data for trends
    const { data: dailyMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('metric_date', startDate.split('T')[0])
      .lte('metric_date', endDate.split('T')[0])
      .order('metric_date', { ascending: true });

    // Process data into trend format
    const customerGrowth = this.processTrendData(dailyMetrics || [], 'customers_created');
    const interactionVolume = this.processTrendData(dailyMetrics || [], 'interactions_created');
    const aiUsage = this.processTrendData(dailyMetrics || [], 'ai_queries_processed');
    
    // Satisfaction trend (placeholder)
    const satisfactionTrend = customerGrowth.map((item, index) => ({
      date: item.date,
      score: 4.0 + Math.sin(index * 0.1) * 0.5 // Simulated satisfaction trend
    }));

    return {
      customer_growth: customerGrowth,
      interaction_volume: interactionVolume,
      ai_usage: aiUsage,
      satisfaction_trend: satisfactionTrend
    };
  }

  private async getPerformanceData(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<DashboardMetrics['performance']> {
    // Get top performing agents
    let agentQuery = supabase
      .from('interaction_details')
      .select('agent_id, agent_email, created_at, sentiment_score')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (agentId) {
      agentQuery = agentQuery.eq('agent_id', agentId);
    }

    const { data: agentData } = await agentQuery;

    // Process agent performance
    const agentStats = (agentData || []).reduce((acc, interaction) => {
      const id = interaction.agent_id;
      if (!acc[id]) {
        acc[id] = {
          agent_id: id,
          agent_name: interaction.agent_email || 'Unknown',
          total_interactions: 0,
          total_sentiment: 0,
          response_times: []
        };
      }
      acc[id].total_interactions++;
      acc[id].total_sentiment += interaction.sentiment_score || 2;
      return acc;
    }, {} as Record<string, any>);

    const topAgents = Object.values(agentStats)
      .map((agent: any) => ({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        total_interactions: agent.total_interactions,
        avg_response_time: 2500, // Placeholder
        satisfaction_score: Math.round((agent.total_sentiment / agent.total_interactions) * 100) / 100,
        resolution_rate: 0.82 // Placeholder
      }))
      .sort((a, b) => b.total_interactions - a.total_interactions)
      .slice(0, 10);

    // AI metrics
    const aiMetrics = {
      total_queries: 0, // Will be filled from actual data
      avg_confidence: 0.78,
      cache_hit_rate: 0.65,
      error_rate: 0.02
    };

    return {
      top_agents: topAgents,
      ai_metrics: aiMetrics
    };
  }

  private async getInsightsData(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<DashboardMetrics['insights']> {
    // Get hourly distribution
    const { data: hourlyData } = await supabase
      .from('interactions')
      .select('created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const peakHours = this.calculatePeakHours(hourlyData || []);

    // Get channel distribution
    const { data: channelData } = await supabase
      .from('interactions')
      .select('type')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const popularChannels = this.calculateChannelDistribution(channelData || []);

    // Get sentiment distribution
    const { data: sentimentData } = await supabase
      .from('interactions')
      .select('sentiment')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('sentiment', 'is', null);

    const sentimentDistribution = this.calculateSentimentDistribution(sentimentData || []);

    return {
      peak_hours: peakHours,
      popular_channels: popularChannels,
      sentiment_distribution: sentimentDistribution,
      escalation_rate: 0.12 // Placeholder
    };
  }

  private calculateSatisfactionScore(interactions: any[]): number {
    if (interactions.length === 0) return 0;
    
    const sentimentScores = interactions
      .filter(i => i.sentiment)
      .map(i => {
        switch (i.sentiment) {
          case 'positive': return 5;
          case 'neutral': return 3;
          case 'negative': return 1;
          default: return 3;
        }
      });

    if (sentimentScores.length === 0) return 3.5;
    
    const avg = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    return Math.round(avg * 10) / 10;
  }

  private calculateCustomerLifetimeValue(interactions: any[]): number {
    // Simplified CLV calculation based on interaction volume and sentiment
    const baseValue = interactions.length * 25; // $25 per interaction
    const sentimentMultiplier = this.calculateSatisfactionScore(interactions) / 3; // Normalize to ~1.0
    return Math.round(baseValue * sentimentMultiplier);
  }

  private calculateAverageResolutionTime(interactions: any[]): number {
    // Simplified - assumes resolution time is 1-3 days based on sentiment
    if (interactions.length === 0) return 0;
    
    const avgSentiment = this.calculateSatisfactionScore(interactions);
    const baseTime = 24; // 24 hours base
    const sentimentFactor = avgSentiment < 3 ? 2 : avgSentiment > 4 ? 0.5 : 1;
    
    return Math.round(baseTime * sentimentFactor);
  }

  private getMostCommonIntents(aiResponses: any[]): string[] {
    const intentCounts = aiResponses.reduce((acc, response) => {
      const intent = response.metadata?.intent || 'general';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent]) => intent);
  }

  private processTrendData(metrics: any[], metricName: string): Array<{ date: string; count: number }> {
    return metrics
      .filter(m => m.metric_name === metricName)
      .map(m => ({
        date: m.metric_date,
        count: m.metric_value
      }));
  }

  private calculatePeakHours(interactions: any[]): Array<{ hour: number; interaction_count: number }> {
    const hourCounts = interactions.reduce((acc, interaction) => {
      const hour = new Date(interaction.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      interaction_count: hourCounts[hour] || 0
    })).sort((a, b) => b.interaction_count - a.interaction_count);
  }

  private calculateChannelDistribution(interactions: any[]): Array<{ channel: string; count: number; percentage: number }> {
    const total = interactions.length;
    const channelCounts = interactions.reduce((acc, interaction) => {
      const channel = interaction.type;
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(channelCounts)
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateSentimentDistribution(interactions: any[]): { positive: number; neutral: number; negative: number } {
    const distribution = interactions.reduce((acc, interaction) => {
      const sentiment = interaction.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });

    return distribution;
  }

  private async generatePerformanceReport(startDate: string, endDate: string, filters: any): Promise<any> {
    // Implementation for performance report
    return { report_type: 'performance', summary: 'Performance metrics and KPIs' };
  }

  private async generateCustomerReport(startDate: string, endDate: string, filters: any): Promise<any> {
    // Implementation for customer report
    return { report_type: 'customer', summary: 'Customer analytics and insights' };
  }

  private async generateAIReport(startDate: string, endDate: string, filters: any): Promise<any> {
    // Implementation for AI report
    return { report_type: 'ai', summary: 'AI performance and usage analytics' };
  }

  private async generateBusinessReport(startDate: string, endDate: string, filters: any): Promise<any> {
    // Implementation for business report
    return { report_type: 'business', summary: 'Business metrics and ROI analysis' };
  }

  private async generatePerformanceCharts(data: any): Promise<any[]> {
    return [
      {
        type: 'line',
        title: 'Performance Trends',
        data: data,
        config: { xAxis: 'date', yAxis: 'value' }
      }
    ];
  }

  private async generateCustomerCharts(data: any): Promise<any[]> {
    return [
      {
        type: 'bar',
        title: 'Customer Metrics',
        data: data,
        config: { xAxis: 'metric', yAxis: 'value' }
      }
    ];
  }

  private async generateAICharts(data: any): Promise<any[]> {
    return [
      {
        type: 'area',
        title: 'AI Usage Metrics',
        data: data,
        config: { xAxis: 'date', yAxis: 'usage' }
      }
    ];
  }

  private async generateBusinessCharts(data: any): Promise<any[]> {
    return [
      {
        type: 'pie',
        title: 'Business Distribution',
        data: data,
        config: { valueField: 'value', categoryField: 'category' }
      }
    ];
  }

  private getReportTitle(reportType: string): string {
    const titles = {
      performance: 'Performance Analysis Report',
      customer: 'Customer Analytics Report',
      ai: 'AI Performance Report',
      business: 'Business Intelligence Report'
    };
    return titles[reportType as keyof typeof titles] || 'Analytics Report';
  }

  private getReportDescription(reportType: string, startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `Comprehensive ${reportType} analysis for the period ${start} to ${end}`;
  }

  private async storeReport(report: ReportData): Promise<void> {
    try {
      await supabase
        .from('generated_reports')
        .insert({
          report_id: report.report_id,
          report_type: report.report_type,
          title: report.title,
          description: report.description,
          data: report.data,
          charts: report.charts,
          period_start: report.period.start_date,
          period_end: report.period.end_date,
          generated_at: report.generated_at
        });
    } catch (error) {
      logger.warn('Failed to store report', { error, reportId: report.report_id });
    }
  }
}

export default DashboardAnalyticsService;