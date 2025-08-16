import { supabase, logger } from '../server';

export interface BIQuery {
  id: string;
  name: string;
  description: string;
  category: string;
  sql_query: string;
  parameters: Record<string, any>;
  result_schema: Record<string, any>;
  cache_duration_minutes: number;
  is_public: boolean;
}

export interface BIQueryResult {
  query_id: string;
  data: any[];
  metadata: {
    row_count: number;
    execution_time_ms: number;
    cached: boolean;
    generated_at: string;
  };
  schema: Record<string, any>;
}

export interface BIDashboard {
  id: string;
  name: string;
  description: string;
  widgets: Array<{
    id: string;
    type: 'metric' | 'chart' | 'table' | 'kpi';
    title: string;
    query_id: string;
    config: any;
    position: { x: number; y: number; width: number; height: number };
  }>;
  layout: {
    columns: number;
    gap: number;
    auto_refresh: boolean;
    refresh_interval: number;
  };
}

export class BusinessIntelligenceService {
  async createQuery(
    name: string,
    description: string,
    category: string,
    sqlQuery: string,
    parameters: Record<string, any> = {},
    resultSchema: Record<string, any> = {},
    cacheDuration: number = 60,
    isPublic: boolean = false,
    createdBy: string
  ): Promise<string> {
    try {
      const queryId = `bi_query_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // Validate SQL query (basic validation)
      this.validateSQLQuery(sqlQuery);

      await supabase
        .from('bi_queries')
        .insert({
          query_id: queryId,
          name,
          description,
          category,
          sql_query: sqlQuery,
          parameters,
          result_schema: resultSchema,
          cache_duration_minutes: cacheDuration,
          is_public: isPublic,
          created_by: createdBy
        });

      logger.info('BI query created', { queryId, name, category });

      return queryId;

    } catch (error) {
      logger.error('Failed to create BI query', { error, name });
      throw error;
    }
  }

  async executeQuery(
    queryId: string,
    parameters: Record<string, any> = {},
    useCache: boolean = true
  ): Promise<BIQueryResult> {
    const startTime = Date.now();

    try {
      // Get query definition
      const { data: queryDef, error: queryError } = await supabase
        .from('bi_queries')
        .select('*')
        .eq('query_id', queryId)
        .single();

      if (queryError || !queryDef) {
        throw new Error(`BI query ${queryId} not found`);
      }

      // Check cache first if enabled
      if (useCache) {
        const cachedResult = await this.getCachedResult(queryId, parameters);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Execute the query
      const result = await this.executeRawQuery(queryDef.sql_query, parameters);
      const executionTime = Date.now() - startTime;

      // Build result object
      const queryResult: BIQueryResult = {
        query_id: queryId,
        data: result.data || [],
        metadata: {
          row_count: result.data?.length || 0,
          execution_time_ms: executionTime,
          cached: false,
          generated_at: new Date().toISOString()
        },
        schema: queryDef.result_schema || this.inferSchema(result.data || [])
      };

      // Cache the result
      if (useCache && queryDef.cache_duration_minutes > 0) {
        await this.cacheResult(queryId, parameters, queryResult, queryDef.cache_duration_minutes);
      }

      // Update query execution stats
      await this.updateQueryStats(queryId, executionTime);

      logger.info('BI query executed', {
        queryId,
        executionTime,
        rowCount: queryResult.metadata.row_count
      });

      return queryResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to execute BI query', {
        error,
        queryId,
        parameters,
        executionTime
      });
      throw error;
    }
  }

  async getQueries(category?: string, isPublic?: boolean): Promise<BIQuery[]> {
    try {
      let query = supabase.from('bi_queries').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(row => ({
        id: row.query_id,
        name: row.name,
        description: row.description,
        category: row.category,
        sql_query: row.sql_query,
        parameters: row.parameters,
        result_schema: row.result_schema,
        cache_duration_minutes: row.cache_duration_minutes,
        is_public: row.is_public
      }));

    } catch (error) {
      logger.error('Failed to get BI queries', { error });
      throw error;
    }
  }

  async updateQuery(
    queryId: string,
    updates: Partial<Omit<BIQuery, 'id'>>
  ): Promise<void> {
    try {
      // Validate SQL if provided
      if (updates.sql_query) {
        this.validateSQLQuery(updates.sql_query);
      }

      await supabase
        .from('bi_queries')
        .update(updates)
        .eq('query_id', queryId);

      // Clear cache for this query
      await this.clearQueryCache(queryId);

      logger.info('BI query updated', { queryId, updates: Object.keys(updates) });

    } catch (error) {
      logger.error('Failed to update BI query', { error, queryId });
      throw error;
    }
  }

  async deleteQuery(queryId: string): Promise<void> {
    try {
      // Clear cache first
      await this.clearQueryCache(queryId);

      // Delete query
      await supabase
        .from('bi_queries')
        .delete()
        .eq('query_id', queryId);

      logger.info('BI query deleted', { queryId });

    } catch (error) {
      logger.error('Failed to delete BI query', { error, queryId });
      throw error;
    }
  }

  async getPopularQueries(limit: number = 10): Promise<Array<BIQuery & { execution_count: number }>> {
    try {
      const { data, error } = await supabase
        .from('bi_queries')
        .select('*')
        .order('execution_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map(row => ({
        id: row.query_id,
        name: row.name,
        description: row.description,
        category: row.category,
        sql_query: row.sql_query,
        parameters: row.parameters,
        result_schema: row.result_schema,
        cache_duration_minutes: row.cache_duration_minutes,
        is_public: row.is_public,
        execution_count: row.execution_count
      }));

    } catch (error) {
      logger.error('Failed to get popular queries', { error });
      throw error;
    }
  }

  async getQueryCategories(): Promise<Array<{ category: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('bi_queries')
        .select('category')
        .order('category');

      if (error) {
        throw error;
      }

      // Count categories
      const categoryCounts = (data || []).reduce((acc, row) => {
        acc[row.category] = (acc[row.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
      }));

    } catch (error) {
      logger.error('Failed to get query categories', { error });
      return [];
    }
  }

  async createPredefinedQueries(): Promise<void> {
    try {
      const predefinedQueries = [
        {
          name: 'Customer Growth Analysis',
          description: 'Monthly customer acquisition and retention metrics',
          category: 'Customer Analytics',
          sql_query: `
            SELECT 
              DATE_TRUNC('month', created_at) as month,
              COUNT(*) as new_customers,
              COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month') as retention_count
            FROM customers 
            WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
          `,
          parameters: {},
          result_schema: {
            month: 'date',
            new_customers: 'integer',
            retention_count: 'integer'
          }
        },
        {
          name: 'Agent Performance Metrics',
          description: 'Key performance indicators for customer service agents',
          category: 'Performance',
          sql_query: `
            SELECT 
              u.email as agent_email,
              COUNT(i.id) as total_interactions,
              AVG(CASE 
                WHEN i.sentiment = 'positive' THEN 5
                WHEN i.sentiment = 'neutral' THEN 3
                WHEN i.sentiment = 'negative' THEN 1
                ELSE 3
              END) as avg_satisfaction,
              COUNT(i.id) FILTER (WHERE i.sentiment = 'positive') as positive_interactions,
              COUNT(i.id) FILTER (WHERE i.sentiment = 'negative') as negative_interactions
            FROM auth.users u
            LEFT JOIN interactions i ON u.id = i.agent_id
            WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY u.id, u.email
            HAVING COUNT(i.id) > 0
            ORDER BY total_interactions DESC
          `,
          parameters: {},
          result_schema: {
            agent_email: 'string',
            total_interactions: 'integer',
            avg_satisfaction: 'decimal',
            positive_interactions: 'integer',
            negative_interactions: 'integer'
          }
        },
        {
          name: 'AI Performance Trends',
          description: 'AI system performance metrics over time',
          category: 'AI Analytics',
          sql_query: `
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as total_queries,
              AVG(processing_time_ms) as avg_processing_time,
              AVG(confidence_score) as avg_confidence,
              COUNT(*) FILTER (WHERE confidence_score >= 0.8) as high_confidence_queries
            FROM ai_responses
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,
          parameters: {},
          result_schema: {
            date: 'date',
            total_queries: 'integer',
            avg_processing_time: 'decimal',
            avg_confidence: 'decimal',
            high_confidence_queries: 'integer'
          }
        },
        {
          name: 'Customer Satisfaction by Channel',
          description: 'Customer satisfaction scores broken down by communication channel',
          category: 'Customer Analytics',
          sql_query: `
            SELECT 
              i.type as channel,
              COUNT(*) as total_interactions,
              AVG(CASE 
                WHEN i.sentiment = 'positive' THEN 5
                WHEN i.sentiment = 'neutral' THEN 3
                WHEN i.sentiment = 'negative' THEN 1
                ELSE 3
              END) as avg_satisfaction,
              COUNT(*) FILTER (WHERE i.sentiment = 'positive') * 100.0 / COUNT(*) as positive_percentage
            FROM interactions i
            WHERE i.created_at >= CURRENT_DATE - INTERVAL '90 days'
              AND i.sentiment IS NOT NULL
            GROUP BY i.type
            ORDER BY avg_satisfaction DESC
          `,
          parameters: {},
          result_schema: {
            channel: 'string',
            total_interactions: 'integer',
            avg_satisfaction: 'decimal',
            positive_percentage: 'decimal'
          }
        },
        {
          name: 'Revenue Impact Analysis',
          description: 'Revenue correlation with customer service metrics',
          category: 'Business Intelligence',
          sql_query: `
            SELECT 
              c.company,
              COUNT(i.id) as total_interactions,
              AVG(CASE 
                WHEN i.sentiment = 'positive' THEN 5
                WHEN i.sentiment = 'neutral' THEN 3
                WHEN i.sentiment = 'negative' THEN 1
                ELSE 3
              END) as avg_satisfaction,
              -- Revenue calculation would need actual revenue data
              COUNT(i.id) * 100 as estimated_value
            FROM customers c
            LEFT JOIN interactions i ON c.id = i.customer_id
            WHERE i.created_at >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY c.id, c.company
            HAVING COUNT(i.id) > 5
            ORDER BY estimated_value DESC
            LIMIT 20
          `,
          parameters: {},
          result_schema: {
            company: 'string',
            total_interactions: 'integer',
            avg_satisfaction: 'decimal',
            estimated_value: 'integer'
          }
        }
      ];

      for (const query of predefinedQueries) {
        try {
          await this.createQuery(
            query.name,
            query.description,
            query.category,
            query.sql_query,
            query.parameters,
            query.result_schema,
            60, // 1 hour cache
            true, // public
            'system'
          );
        } catch (error) {
          logger.warn('Failed to create predefined query', { error, name: query.name });
        }
      }

      logger.info('Predefined BI queries created');

    } catch (error) {
      logger.error('Failed to create predefined queries', { error });
    }
  }

  private async executeRawQuery(sqlQuery: string, parameters: Record<string, any>): Promise<{ data: any[] }> {
    try {
      // Replace parameters in query (basic implementation)
      let processedQuery = sqlQuery;
      Object.entries(parameters).forEach(([key, value]) => {
        const placeholder = `$${key}`;
        processedQuery = processedQuery.replace(new RegExp(`\\${placeholder}\\b`, 'g'), value);
      });

      // Execute query using supabase rpc or direct SQL
      // Note: In a real implementation, you'd want proper parameter binding
      const { data, error } = await supabase.rpc('execute_bi_query', { query: processedQuery });

      if (error) {
        throw error;
      }

      return { data: data || [] };

    } catch (error) {
      logger.error('Failed to execute raw query', { error });
      throw error;
    }
  }

  private async getCachedResult(queryId: string, parameters: Record<string, any>): Promise<BIQueryResult | null> {
    try {
      const parametersHash = this.hashParameters(parameters);

      const { data, error } = await supabase
        .from('bi_query_cache')
        .select('*')
        .eq('query_id', queryId)
        .eq('parameters_hash', parametersHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return {
        query_id: queryId,
        data: data.result_data.data || [],
        metadata: {
          ...data.result_data.metadata,
          cached: true
        },
        schema: data.result_data.schema || {}
      };

    } catch (error) {
      logger.warn('Failed to get cached result', { error });
      return null;
    }
  }

  private async cacheResult(
    queryId: string,
    parameters: Record<string, any>,
    result: BIQueryResult,
    cacheDurationMinutes: number
  ): Promise<void> {
    try {
      const parametersHash = this.hashParameters(parameters);
      const expiresAt = new Date(Date.now() + cacheDurationMinutes * 60 * 1000);

      await supabase
        .from('bi_query_cache')
        .upsert({
          query_id: queryId,
          parameters_hash: parametersHash,
          result_data: result,
          expires_at: expiresAt.toISOString()
        });

    } catch (error) {
      logger.warn('Failed to cache result', { error });
    }
  }

  private async clearQueryCache(queryId: string): Promise<void> {
    try {
      await supabase
        .from('bi_query_cache')
        .delete()
        .eq('query_id', queryId);

    } catch (error) {
      logger.warn('Failed to clear query cache', { error });
    }
  }

  private async updateQueryStats(queryId: string, executionTime: number): Promise<void> {
    try {
      // Get current stats
      const { data: currentStats } = await supabase
        .from('bi_queries')
        .select('execution_count, avg_execution_time_ms')
        .eq('query_id', queryId)
        .single();

      if (currentStats) {
        const newCount = (currentStats.execution_count || 0) + 1;
        const oldAvg = currentStats.avg_execution_time_ms || 0;
        const newAvg = Math.round((oldAvg * (newCount - 1) + executionTime) / newCount);

        await supabase
          .from('bi_queries')
          .update({
            execution_count: newCount,
            avg_execution_time_ms: newAvg,
            last_executed: new Date().toISOString()
          })
          .eq('query_id', queryId);
      }

    } catch (error) {
      logger.warn('Failed to update query stats', { error });
    }
  }

  private validateSQLQuery(sqlQuery: string): void {
    const query = sqlQuery.toLowerCase().trim();
    
    // Basic validation - only allow SELECT statements
    if (!query.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Prevent dangerous operations
    const forbiddenKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
    for (const keyword of forbiddenKeywords) {
      if (query.includes(keyword)) {
        throw new Error(`Forbidden keyword: ${keyword}`);
      }
    }

    // Basic length validation
    if (query.length > 10000) {
      throw new Error('Query too long');
    }
  }

  private hashParameters(parameters: Record<string, any>): string {
    const sorted = Object.keys(parameters).sort().reduce((result, key) => {
      result[key] = parameters[key];
      return result;
    }, {} as Record<string, any>);

    // Simple hash implementation
    const str = JSON.stringify(sorted);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private inferSchema(data: any[]): Record<string, string> {
    if (!data || data.length === 0) {
      return {};
    }

    const sample = data[0];
    const schema: Record<string, string> = {};

    Object.entries(sample).forEach(([key, value]) => {
      if (typeof value === 'number') {
        schema[key] = Number.isInteger(value) ? 'integer' : 'decimal';
      } else if (typeof value === 'boolean') {
        schema[key] = 'boolean';
      } else if (value instanceof Date) {
        schema[key] = 'date';
      } else {
        schema[key] = 'string';
      }
    });

    return schema;
  }
}

export default BusinessIntelligenceService;