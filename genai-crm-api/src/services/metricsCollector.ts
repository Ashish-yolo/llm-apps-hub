import { supabase, logger } from '../server';
import { EventEmitter } from 'events';

export interface MetricEvent {
  metric_name: string;
  metric_value: number;
  dimensions?: Record<string, any>;
  timestamp: string;
  source: string;
  user_id?: string;
  customer_id?: string;
}

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric_name: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percentage';
  threshold: number;
  time_window_minutes: number;
  enabled: boolean;
  notification_channels: string[];
}

export class MetricsCollectorService extends EventEmitter {
  private metricsBuffer: MetricEvent[] = [];
  private bufferFlushInterval = 30000; // 30 seconds
  private realTimeMetrics = new Map<string, RealTimeMetric>();
  private alertRules: AlertRule[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.startMetricsCollection();
    this.loadAlertRules();
  }

  async recordMetric(
    metricName: string,
    value: number,
    dimensions: Record<string, any> = {},
    source = 'api',
    userId?: string,
    customerId?: string
  ): Promise<void> {
    try {
      const metric: MetricEvent = {
        metric_name: metricName,
        metric_value: value,
        dimensions,
        timestamp: new Date().toISOString(),
        source,
        user_id: userId,
        customer_id: customerId
      };

      // Add to buffer for batch processing
      this.metricsBuffer.push(metric);

      // Update real-time metrics
      await this.updateRealTimeMetric(metric);

      // Check alert conditions
      await this.checkAlertConditions(metric);

      // Emit event for real-time updates
      this.emit('metric_recorded', metric);

      logger.debug('Metric recorded', {
        metric_name: metricName,
        value,
        source,
        buffer_size: this.metricsBuffer.length
      });

    } catch (error) {
      logger.error('Failed to record metric', { error, metricName, value });
    }
  }

  async recordInteractionMetric(
    interactionType: string,
    userId: string,
    customerId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await Promise.all([
      this.recordMetric('interaction_created', 1, {
        type: interactionType,
        ...metadata
      }, 'interaction', userId, customerId),
      
      this.recordMetric(`interaction_${interactionType}`, 1, metadata, 'interaction', userId, customerId),
      
      this.recordMetric('user_activity', 1, {
        activity_type: 'interaction',
        interaction_type: interactionType
      }, 'user', userId)
    ]);
  }

  async recordAIMetric(
    queryType: string,
    processingTime: number,
    confidence: number,
    userId: string,
    customerId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await Promise.all([
      this.recordMetric('ai_query_processed', 1, {
        query_type: queryType,
        ...metadata
      }, 'ai', userId, customerId),
      
      this.recordMetric('ai_processing_time', processingTime, {
        query_type: queryType
      }, 'ai', userId, customerId),
      
      this.recordMetric('ai_confidence_score', confidence, {
        query_type: queryType
      }, 'ai', userId, customerId),
      
      this.recordMetric('ai_performance_score', this.calculatePerformanceScore(processingTime, confidence), {
        query_type: queryType
      }, 'ai', userId, customerId)
    ]);
  }

  async recordBusinessMetric(
    metricName: string,
    value: number,
    dimensions: Record<string, any> = {}
  ): Promise<void> {
    await this.recordMetric(metricName, value, dimensions, 'business');
  }

  async getRealtimeMetrics(): Promise<RealTimeMetric[]> {
    try {
      // Update metrics with latest data
      await this.refreshRealTimeMetrics();
      
      return Array.from(this.realTimeMetrics.values())
        .sort((a, b) => b.last_updated.localeCompare(a.last_updated));

    } catch (error) {
      logger.error('Failed to get realtime metrics', { error });
      return [];
    }
  }

  async getMetricHistory(
    metricName: string,
    startDate: string,
    endDate: string,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<Array<{ timestamp: string; value: number; count: number }>> {
    try {
      let interval: string;
      switch (granularity) {
        case 'hour':
          interval = '1 hour';
          break;
        case 'week':
          interval = '1 week';
          break;
        default:
          interval = '1 day';
      }

      const { data, error } = await supabase
        .from('analytics')
        .select('date, hour, metric_value')
        .eq('metric_name', metricName)
        .gte('date', startDate.split('T')[0])
        .lte('date', endDate.split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      // Group and aggregate data based on granularity
      const grouped = this.groupMetricsByGranularity(data || [], granularity);
      
      return grouped;

    } catch (error) {
      logger.error('Failed to get metric history', { error, metricName });
      return [];
    }
  }

  async createAlert(alertRule: Omit<AlertRule, 'id'>): Promise<string> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const newAlert: AlertRule = {
        id: alertId,
        ...alertRule
      };

      // Store in database
      await supabase
        .from('alert_rules')
        .insert({
          alert_id: alertId,
          name: newAlert.name,
          metric_name: newAlert.metric_name,
          condition: newAlert.condition,
          threshold: newAlert.threshold,
          time_window_minutes: newAlert.time_window_minutes,
          enabled: newAlert.enabled,
          notification_channels: newAlert.notification_channels
        });

      // Add to memory
      this.alertRules.push(newAlert);

      logger.info('Alert rule created', { alertId, name: newAlert.name });
      
      return alertId;

    } catch (error) {
      logger.error('Failed to create alert', { error });
      throw error;
    }
  }

  async updateAlert(alertId: string, updates: Partial<AlertRule>): Promise<void> {
    try {
      // Update in database
      await supabase
        .from('alert_rules')
        .update(updates)
        .eq('alert_id', alertId);

      // Update in memory
      const alertIndex = this.alertRules.findIndex(alert => alert.id === alertId);
      if (alertIndex !== -1) {
        this.alertRules[alertIndex] = { ...this.alertRules[alertIndex], ...updates };
      }

      logger.info('Alert rule updated', { alertId, updates });

    } catch (error) {
      logger.error('Failed to update alert', { error, alertId });
      throw error;
    }
  }

  async deleteAlert(alertId: string): Promise<void> {
    try {
      // Delete from database
      await supabase
        .from('alert_rules')
        .delete()
        .eq('alert_id', alertId);

      // Remove from memory
      this.alertRules = this.alertRules.filter(alert => alert.id !== alertId);

      logger.info('Alert rule deleted', { alertId });

    } catch (error) {
      logger.error('Failed to delete alert', { error, alertId });
      throw error;
    }
  }

  async getActiveAlerts(): Promise<AlertRule[]> {
    return this.alertRules.filter(alert => alert.enabled);
  }

  private startMetricsCollection(): void {
    // Start periodic flush of metrics buffer
    this.flushTimer = setInterval(() => {
      this.flushMetricsBuffer();
    }, this.bufferFlushInterval);

    logger.info('Metrics collection started', {
      flush_interval: this.bufferFlushInterval
    });
  }

  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = []; // Clear buffer

      // Group metrics by date and hour for efficient storage
      const groupedMetrics = this.groupMetricsForStorage(metricsToFlush);

      // Insert/update in database
      for (const metric of groupedMetrics) {
        await supabase
          .from('analytics')
          .upsert({
            metric_name: metric.metric_name,
            metric_value: metric.metric_value,
            dimensions: metric.dimensions,
            date: metric.date,
            hour: metric.hour
          }, {
            onConflict: 'metric_name,date,hour,organization_id'
          });
      }

      logger.debug('Metrics buffer flushed', {
        metrics_count: metricsToFlush.length,
        grouped_count: groupedMetrics.length
      });

    } catch (error) {
      logger.error('Failed to flush metrics buffer', { error });
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  private async updateRealTimeMetric(metric: MetricEvent): Promise<void> {
    const existing = this.realTimeMetrics.get(metric.metric_name);
    const now = new Date().toISOString();

    if (existing) {
      const changePercentage = ((metric.metric_value - existing.value) / existing.value) * 100;
      const trend = changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable';

      this.realTimeMetrics.set(metric.metric_name, {
        ...existing,
        value: metric.metric_value,
        change_percentage: Math.round(changePercentage * 100) / 100,
        trend,
        last_updated: now
      });
    } else {
      this.realTimeMetrics.set(metric.metric_name, {
        id: `metric_${Date.now()}`,
        name: metric.metric_name,
        value: metric.metric_value,
        change_percentage: 0,
        trend: 'stable',
        last_updated: now
      });
    }
  }

  private async refreshRealTimeMetrics(): Promise<void> {
    try {
      // Get latest metrics from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('analytics')
        .select('metric_name, metric_value, created_at')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Update real-time metrics with latest data
      const latestMetrics = new Map<string, number>();
      data?.forEach(row => {
        if (!latestMetrics.has(row.metric_name)) {
          latestMetrics.set(row.metric_name, row.metric_value);
        }
      });

      latestMetrics.forEach((value, metricName) => {
        this.updateRealTimeMetric({
          metric_name: metricName,
          metric_value: value,
          timestamp: new Date().toISOString(),
          source: 'refresh'
        });
      });

    } catch (error) {
      logger.error('Failed to refresh real-time metrics', { error });
    }
  }

  private async checkAlertConditions(metric: MetricEvent): Promise<void> {
    const relevantAlerts = this.alertRules.filter(
      alert => alert.enabled && alert.metric_name === metric.metric_name
    );

    for (const alert of relevantAlerts) {
      try {
        const triggered = await this.evaluateAlertCondition(alert, metric);
        
        if (triggered) {
          await this.triggerAlert(alert, metric);
        }

      } catch (error) {
        logger.error('Failed to check alert condition', { error, alertId: alert.id });
      }
    }
  }

  private async evaluateAlertCondition(alert: AlertRule, metric: MetricEvent): Promise<boolean> {
    switch (alert.condition) {
      case 'greater_than':
        return metric.metric_value > alert.threshold;
        
      case 'less_than':
        return metric.metric_value < alert.threshold;
        
      case 'equals':
        return metric.metric_value === alert.threshold;
        
      case 'change_percentage':
        // Get previous value to calculate percentage change
        const previousValue = await this.getPreviousMetricValue(
          metric.metric_name, 
          alert.time_window_minutes
        );
        if (previousValue === null) return false;
        
        const changePercentage = Math.abs((metric.metric_value - previousValue) / previousValue) * 100;
        return changePercentage > alert.threshold;
        
      default:
        return false;
    }
  }

  private async getPreviousMetricValue(metricName: string, minutesAgo: number): Promise<number | null> {
    try {
      const timestampAgo = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('analytics')
        .select('metric_value')
        .eq('metric_name', metricName)
        .lte('created_at', timestampAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0].metric_value;

    } catch (error) {
      logger.error('Failed to get previous metric value', { error });
      return null;
    }
  }

  private async triggerAlert(alert: AlertRule, metric: MetricEvent): Promise<void> {
    try {
      const alertData = {
        alert_id: alert.id,
        alert_name: alert.name,
        metric_name: metric.metric_name,
        metric_value: metric.metric_value,
        threshold: alert.threshold,
        condition: alert.condition,
        triggered_at: new Date().toISOString()
      };

      // Store alert trigger
      await supabase
        .from('alert_triggers')
        .insert(alertData);

      // Emit alert event
      this.emit('alert_triggered', alertData);

      logger.warn('Alert triggered', alertData);

    } catch (error) {
      logger.error('Failed to trigger alert', { error, alertId: alert.id });
    }
  }

  private groupMetricsForStorage(metrics: MetricEvent[]): Array<{
    metric_name: string;
    metric_value: number;
    dimensions: Record<string, any>;
    date: string;
    hour: number;
  }> {
    const grouped = new Map<string, {
      metric_name: string;
      total_value: number;
      count: number;
      dimensions: Record<string, any>;
      date: string;
      hour: number;
    }>();

    metrics.forEach(metric => {
      const date = metric.timestamp.split('T')[0];
      const hour = new Date(metric.timestamp).getHours();
      const key = `${metric.metric_name}_${date}_${hour}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.total_value += metric.metric_value;
        existing.count++;
      } else {
        grouped.set(key, {
          metric_name: metric.metric_name,
          total_value: metric.metric_value,
          count: 1,
          dimensions: metric.dimensions || {},
          date,
          hour
        });
      }
    });

    return Array.from(grouped.values()).map(group => ({
      metric_name: group.metric_name,
      metric_value: group.total_value / group.count, // Average value
      dimensions: group.dimensions,
      date: group.date,
      hour: group.hour
    }));
  }

  private groupMetricsByGranularity(
    data: any[], 
    granularity: 'hour' | 'day' | 'week'
  ): Array<{ timestamp: string; value: number; count: number }> {
    const grouped = new Map<string, { total: number; count: number }>();

    data.forEach(row => {
      let key: string;
      
      switch (granularity) {
        case 'hour':
          key = `${row.date}T${String(row.hour || 0).padStart(2, '0')}:00:00`;
          break;
        case 'week':
          const date = new Date(row.date);
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toISOString().split('T')[0];
          break;
        default: // day
          key = row.date;
      }

      const existing = grouped.get(key);
      if (existing) {
        existing.total += row.metric_value;
        existing.count++;
      } else {
        grouped.set(key, { total: row.metric_value, count: 1 });
      }
    });

    return Array.from(grouped.entries())
      .map(([timestamp, stats]) => ({
        timestamp,
        value: stats.total / stats.count,
        count: stats.count
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private calculatePerformanceScore(processingTime: number, confidence: number): number {
    // Normalize processing time (lower is better, max 5000ms)
    const timeScore = Math.max(0, (5000 - Math.min(processingTime, 5000)) / 5000);
    
    // Confidence score is already 0-1
    const confidenceScore = confidence;
    
    // Weighted average (60% confidence, 40% speed)
    return Math.round((confidenceScore * 0.6 + timeScore * 0.4) * 100) / 100;
  }

  private async loadAlertRules(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

      if (error) {
        throw error;
      }

      this.alertRules = (data || []).map(row => ({
        id: row.alert_id,
        name: row.name,
        metric_name: row.metric_name,
        condition: row.condition,
        threshold: row.threshold,
        time_window_minutes: row.time_window_minutes,
        enabled: row.enabled,
        notification_channels: row.notification_channels || []
      }));

      logger.info('Alert rules loaded', { count: this.alertRules.length });

    } catch (error) {
      logger.error('Failed to load alert rules', { error });
      this.alertRules = [];
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushMetricsBuffer(); // Final flush
    this.removeAllListeners();
  }
}

export default MetricsCollectorService;