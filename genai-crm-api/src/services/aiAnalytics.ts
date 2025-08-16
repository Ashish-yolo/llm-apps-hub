import { supabase, logger } from '../server';

export interface AIPerformanceMetrics {
  total_queries: number;
  avg_processing_time: number;
  avg_confidence_score: number;
  success_rate: number;
  error_rate: number;
  cache_hit_rate: number;
  top_intents: Array<{ intent: string; count: number; percentage: number }>;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  quality_scores: {
    excellent: number; // 9-10
    good: number;      // 7-8
    fair: number;      // 5-6
    poor: number;      // <5
  };
}

export interface AIUsageAnalytics {
  queries_by_hour: Array<{ hour: number; count: number }>;
  queries_by_day: Array<{ date: string; count: number }>;
  popular_query_types: Array<{ type: string; count: number }>;
  user_adoption: {
    total_users: number;
    active_users: number;
    new_users: number;
  };
  response_effectiveness: {
    avg_user_satisfaction: number;
    escalation_rate: number;
    resolution_rate: number;
  };
}

export interface ModelPerformanceComparison {
  model_name: string;
  total_queries: number;
  avg_processing_time: number;
  avg_confidence: number;
  user_satisfaction: number;
  cost_per_query: number;
  error_rate: number;
}

export class AIAnalyticsService {
  async getPerformanceMetrics(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<AIPerformanceMetrics> {
    try {
      let query = supabase
        .from('ai_responses')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: responses, error } = await query;

      if (error) {
        throw error;
      }

      const totalQueries = responses?.length || 0;
      
      if (totalQueries === 0) {
        return this.getEmptyMetrics();
      }

      // Calculate metrics
      const avgProcessingTime = responses!.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / totalQueries;
      const avgConfidenceScore = responses!.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / totalQueries;
      
      // Success rate (responses with confidence > 0.6)
      const successfulResponses = responses!.filter(r => (r.confidence_score || 0) > 0.6);
      const successRate = (successfulResponses.length / totalQueries) * 100;
      
      // Error rate calculation would require tracking errors separately
      const errorRate = 0; // Placeholder

      // Cache hit rate would need to be tracked by the AI service
      const cacheHitRate = 0; // Placeholder

      // Intent analysis
      const intentCounts = responses!.reduce((acc, r) => {
        const intent = r.metadata?.intent || 'unknown';
        acc[intent] = (acc[intent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topIntents = Object.entries(intentCounts)
        .map(([intent, count]) => ({
          intent,
          count,
          percentage: (count / totalQueries) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Sentiment distribution
      const sentimentCounts = responses!.reduce((acc, r) => {
        const sentiment = r.metadata?.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      }, { positive: 0, neutral: 0, negative: 0 });

      // Quality scores (based on confidence)
      const qualityScores = responses!.reduce((acc, r) => {
        const confidence = r.confidence_score || 0;
        if (confidence >= 0.9) acc.excellent++;
        else if (confidence >= 0.7) acc.good++;
        else if (confidence >= 0.5) acc.fair++;
        else acc.poor++;
        return acc;
      }, { excellent: 0, good: 0, fair: 0, poor: 0 });

      return {
        total_queries: totalQueries,
        avg_processing_time: Math.round(avgProcessingTime),
        avg_confidence_score: Math.round(avgConfidenceScore * 100) / 100,
        success_rate: Math.round(successRate * 100) / 100,
        error_rate: errorRate,
        cache_hit_rate: cacheHitRate,
        top_intents: topIntents,
        sentiment_distribution: sentimentCounts,
        quality_scores: qualityScores
      };

    } catch (error) {
      logger.error('Failed to get AI performance metrics', { error });
      throw error;
    }
  }

  async getUsageAnalytics(
    startDate: string,
    endDate: string
  ): Promise<AIUsageAnalytics> {
    try {
      const { data: responses, error } = await supabase
        .from('ai_responses')
        .select('user_id, created_at, metadata')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        throw error;
      }

      // Queries by hour
      const hourlyData = responses!.reduce((acc, r) => {
        const hour = new Date(r.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const queriesByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourlyData[hour] || 0
      }));

      // Queries by day
      const dailyData = responses!.reduce((acc, r) => {
        const date = r.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const queriesByDay = Object.entries(dailyData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Popular query types (based on intent)
      const queryTypes = responses!.reduce((acc, r) => {
        const type = r.metadata?.intent || 'general';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularQueryTypes = Object.entries(queryTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // User adoption metrics
      const uniqueUsers = new Set(responses!.map(r => r.user_id)).size;
      const totalUsers = uniqueUsers; // This could be enhanced with user registration data
      const activeUsers = uniqueUsers;
      const newUsers = 0; // Would need user registration tracking

      // Response effectiveness (placeholder values - would need feedback data)
      const responseEffectiveness = {
        avg_user_satisfaction: 4.2,
        escalation_rate: 15.5,
        resolution_rate: 78.3
      };

      return {
        queries_by_hour: queriesByHour,
        queries_by_day: queriesByDay,
        popular_query_types: popularQueryTypes,
        user_adoption: {
          total_users: totalUsers,
          active_users: activeUsers,
          new_users: newUsers
        },
        response_effectiveness: responseEffectiveness
      };

    } catch (error) {
      logger.error('Failed to get AI usage analytics', { error });
      throw error;
    }
  }

  async compareModelPerformance(
    startDate: string,
    endDate: string
  ): Promise<ModelPerformanceComparison[]> {
    try {
      const { data: responses, error } = await supabase
        .from('ai_responses')
        .select('model_version, processing_time_ms, confidence_score, metadata')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        throw error;
      }

      const modelStats = responses!.reduce((acc, r) => {
        const model = r.model_version || 'unknown';
        if (!acc[model]) {
          acc[model] = {
            total_queries: 0,
            total_processing_time: 0,
            total_confidence: 0,
            total_cost: 0,
            errors: 0
          };
        }
        
        acc[model].total_queries++;
        acc[model].total_processing_time += r.processing_time_ms || 0;
        acc[model].total_confidence += r.confidence_score || 0;
        // Cost calculation would need pricing data
        acc[model].total_cost += 0.001; // Placeholder
        
        return acc;
      }, {} as Record<string, any>);

      return Object.entries(modelStats).map(([modelName, stats]) => ({
        model_name: modelName,
        total_queries: stats.total_queries,
        avg_processing_time: Math.round(stats.total_processing_time / stats.total_queries),
        avg_confidence: Math.round((stats.total_confidence / stats.total_queries) * 100) / 100,
        user_satisfaction: 4.2, // Placeholder
        cost_per_query: Math.round((stats.total_cost / stats.total_queries) * 1000) / 1000,
        error_rate: (stats.errors / stats.total_queries) * 100
      }));

    } catch (error) {
      logger.error('Failed to compare model performance', { error });
      throw error;
    }
  }

  async recordAIMetric(
    metricName: string,
    metricValue: number,
    dimensions: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase
        .from('analytics')
        .insert({
          metric_name: `ai_${metricName}`,
          metric_value: metricValue,
          dimensions,
          date: new Date().toISOString().split('T')[0],
          hour: new Date().getHours()
        });

    } catch (error) {
      logger.error('Failed to record AI metric', { error });
    }
  }

  async getAITrends(
    metricName: string,
    days: number = 30
  ): Promise<Array<{ date: string; value: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics')
        .select('date, metric_value')
        .eq('metric_name', `ai_${metricName}`)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      // Group by date and calculate average if multiple entries per day
      const grouped = data!.reduce((acc, row) => {
        const date = row.date;
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += row.metric_value;
        acc[date].count++;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      return Object.entries(grouped).map(([date, stats]) => ({
        date,
        value: Math.round((stats.total / stats.count) * 100) / 100
      }));

    } catch (error) {
      logger.error('Failed to get AI trends', { error });
      return [];
    }
  }

  async generateAIInsights(
    startDate: string,
    endDate: string
  ): Promise<{
    insights: string[];
    recommendations: string[];
    alerts: string[];
  }> {
    try {
      const metrics = await this.getPerformanceMetrics(startDate, endDate);
      const usage = await this.getUsageAnalytics(startDate, endDate);

      const insights: string[] = [];
      const recommendations: string[] = [];
      const alerts: string[] = [];

      // Generate insights based on metrics
      if (metrics.avg_confidence_score > 0.8) {
        insights.push(`High AI confidence score: ${metrics.avg_confidence_score.toFixed(2)}`);
      }

      if (metrics.success_rate > 85) {
        insights.push(`Strong success rate: ${metrics.success_rate.toFixed(1)}%`);
      } else if (metrics.success_rate < 70) {
        alerts.push(`Low success rate: ${metrics.success_rate.toFixed(1)}% - requires attention`);
        recommendations.push('Review and improve prompt templates');
      }

      if (metrics.avg_processing_time > 3000) {
        alerts.push(`High processing time: ${metrics.avg_processing_time}ms`);
        recommendations.push('Consider optimizing AI model settings or caching');
      }

      // Peak usage insights
      const peakHour = usage.queries_by_hour.reduce((max, current) => 
        current.count > max.count ? current : max
      );
      insights.push(`Peak usage at ${peakHour.hour}:00 with ${peakHour.count} queries`);

      // Quality distribution insights
      const totalQueries = Object.values(metrics.quality_scores).reduce((a, b) => a + b, 0);
      const excellentPercentage = (metrics.quality_scores.excellent / totalQueries) * 100;
      
      if (excellentPercentage > 60) {
        insights.push(`${excellentPercentage.toFixed(1)}% of responses are excellent quality`);
      } else if (excellentPercentage < 30) {
        alerts.push(`Only ${excellentPercentage.toFixed(1)}% of responses are excellent quality`);
        recommendations.push('Focus on improving response quality through better context');
      }

      return { insights, recommendations, alerts };

    } catch (error) {
      logger.error('Failed to generate AI insights', { error });
      return {
        insights: ['Unable to generate insights due to data access error'],
        recommendations: [],
        alerts: ['Data analysis failed - check system status']
      };
    }
  }

  private getEmptyMetrics(): AIPerformanceMetrics {
    return {
      total_queries: 0,
      avg_processing_time: 0,
      avg_confidence_score: 0,
      success_rate: 0,
      error_rate: 0,
      cache_hit_rate: 0,
      top_intents: [],
      sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
      quality_scores: { excellent: 0, good: 0, fair: 0, poor: 0 }
    };
  }
}

export default AIAnalyticsService;