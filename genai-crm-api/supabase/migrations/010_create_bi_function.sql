-- Create function to execute BI queries safely
CREATE OR REPLACE FUNCTION execute_bi_query(query text)
RETURNS TABLE(result jsonb) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    query_lower text;
BEGIN
    -- Convert query to lowercase for validation
    query_lower := lower(trim(query));
    
    -- Security validation: only allow SELECT statements
    IF NOT query_lower LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Check for forbidden keywords
    IF query_lower ~ '\b(drop|delete|insert|update|alter|create|truncate|grant|revoke)\b' THEN
        RAISE EXCEPTION 'Forbidden SQL keywords detected';
    END IF;
    
    -- Limit query length
    IF length(query) > 10000 THEN
        RAISE EXCEPTION 'Query too long (max 10000 characters)';
    END IF;
    
    -- Execute the query and return results as JSONB
    RETURN QUERY EXECUTE format('
        WITH query_result AS (%s)
        SELECT jsonb_agg(to_jsonb(query_result.*)) as result
        FROM query_result
    ', query);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION execute_bi_query TO authenticated;

-- Create helper function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM bi_query_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Create function to get query execution statistics
CREATE OR REPLACE FUNCTION get_query_stats(query_id_param text DEFAULT NULL)
RETURNS TABLE(
    query_id text,
    query_name text,
    category text,
    execution_count integer,
    avg_execution_time_ms integer,
    last_executed timestamp with time zone,
    cache_hit_ratio decimal
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bq.query_id::text,
        bq.name::text,
        bq.category::text,
        bq.execution_count,
        bq.avg_execution_time_ms,
        bq.last_executed,
        CASE 
            WHEN bq.execution_count > 0 THEN
                COALESCE(cache_stats.cache_hits::decimal / bq.execution_count, 0)
            ELSE 0
        END as cache_hit_ratio
    FROM bi_queries bq
    LEFT JOIN (
        SELECT 
            query_id,
            COUNT(*) as cache_hits
        FROM bi_query_cache 
        WHERE cached_at > NOW() - INTERVAL '30 days'
        GROUP BY query_id
    ) cache_stats ON bq.query_id = cache_stats.query_id
    WHERE (query_id_param IS NULL OR bq.query_id = query_id_param)
    ORDER BY bq.execution_count DESC;
END;
$$;

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    refresh_start timestamp;
    refresh_end timestamp;
    duration_ms integer;
BEGIN
    refresh_start := clock_timestamp();
    
    -- Refresh the daily metrics materialized view
    REFRESH MATERIALIZED VIEW daily_metrics;
    
    refresh_end := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (refresh_end - refresh_start)) * 1000;
    
    -- Log the refresh
    INSERT INTO analytics (metric_name, metric_value, dimensions, date, hour)
    VALUES (
        'materialized_view_refresh_time', 
        duration_ms,
        jsonb_build_object('view_name', 'daily_metrics'),
        CURRENT_DATE,
        EXTRACT(HOUR FROM NOW())::integer
    );
    
    RETURN format('Analytics views refreshed in %s ms', duration_ms);
END;
$$;

-- Create function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_advanced_clv(customer_uuid UUID)
RETURNS TABLE(
    customer_id UUID,
    base_clv decimal,
    interaction_score decimal,
    satisfaction_multiplier decimal,
    final_clv decimal,
    risk_score decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    interaction_count integer;
    avg_satisfaction decimal;
    satisfaction_trend decimal;
    days_since_last_interaction integer;
BEGIN
    -- Get customer interaction statistics
    SELECT 
        COUNT(*),
        AVG(CASE 
            WHEN sentiment = 'positive' THEN 5
            WHEN sentiment = 'neutral' THEN 3
            WHEN sentiment = 'negative' THEN 1
            ELSE 3
        END),
        EXTRACT(DAYS FROM NOW() - MAX(created_at))
    INTO interaction_count, avg_satisfaction, days_since_last_interaction
    FROM interactions 
    WHERE customer_id = customer_uuid;
    
    -- Calculate satisfaction trend (last 30 days vs previous 30 days)
    WITH recent_satisfaction AS (
        SELECT AVG(CASE 
            WHEN sentiment = 'positive' THEN 5
            WHEN sentiment = 'neutral' THEN 3
            WHEN sentiment = 'negative' THEN 1
            ELSE 3
        END) as recent_score
        FROM interactions 
        WHERE customer_id = customer_uuid 
        AND created_at >= NOW() - INTERVAL '30 days'
    ),
    previous_satisfaction AS (
        SELECT AVG(CASE 
            WHEN sentiment = 'positive' THEN 5
            WHEN sentiment = 'neutral' THEN 3
            WHEN sentiment = 'negative' THEN 1
            ELSE 3
        END) as previous_score
        FROM interactions 
        WHERE customer_id = customer_uuid 
        AND created_at >= NOW() - INTERVAL '60 days'
        AND created_at < NOW() - INTERVAL '30 days'
    )
    SELECT 
        COALESCE(r.recent_score, 0) - COALESCE(p.previous_score, 0)
    INTO satisfaction_trend
    FROM recent_satisfaction r 
    CROSS JOIN previous_satisfaction p;
    
    RETURN QUERY
    SELECT 
        customer_uuid,
        (COALESCE(interaction_count, 0) * 25.0)::decimal as base_clv,
        (LEAST(interaction_count * 5.0, 100.0))::decimal as interaction_score,
        (COALESCE(avg_satisfaction, 3.0) / 3.0)::decimal as satisfaction_multiplier,
        (
            (COALESCE(interaction_count, 0) * 25.0) * 
            (COALESCE(avg_satisfaction, 3.0) / 3.0) * 
            (1 + COALESCE(satisfaction_trend, 0) * 0.1)
        )::decimal as final_clv,
        (
            CASE 
                WHEN days_since_last_interaction > 90 THEN 0.8
                WHEN days_since_last_interaction > 60 THEN 0.6
                WHEN days_since_last_interaction > 30 THEN 0.4
                WHEN avg_satisfaction < 2.5 THEN 0.7
                ELSE 0.2
            END
        )::decimal as risk_score;
END;
$$;

-- Create function to get comprehensive analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
    start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    metric_category text,
    metric_name text,
    current_value decimal,
    previous_value decimal,
    change_percentage decimal,
    trend text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            'customers' as category,
            'total_customers' as metric,
            COUNT(*)::decimal as value
        FROM customers 
        WHERE created_at::date BETWEEN start_date AND end_date
        
        UNION ALL
        
        SELECT 
            'interactions' as category,
            'total_interactions' as metric,
            COUNT(*)::decimal as value
        FROM interactions 
        WHERE created_at::date BETWEEN start_date AND end_date
        
        UNION ALL
        
        SELECT 
            'satisfaction' as category,
            'avg_satisfaction' as metric,
            AVG(CASE 
                WHEN sentiment = 'positive' THEN 5
                WHEN sentiment = 'neutral' THEN 3
                WHEN sentiment = 'negative' THEN 1
                ELSE 3
            END)::decimal as value
        FROM interactions 
        WHERE created_at::date BETWEEN start_date AND end_date
        AND sentiment IS NOT NULL
        
        UNION ALL
        
        SELECT 
            'ai' as category,
            'ai_queries' as metric,
            COUNT(*)::decimal as value
        FROM ai_responses 
        WHERE created_at::date BETWEEN start_date AND end_date
    ),
    previous_period AS (
        SELECT 
            'customers' as category,
            'total_customers' as metric,
            COUNT(*)::decimal as value
        FROM customers 
        WHERE created_at::date BETWEEN (start_date - (end_date - start_date)) AND start_date
        
        UNION ALL
        
        SELECT 
            'interactions' as category,
            'total_interactions' as metric,
            COUNT(*)::decimal as value
        FROM interactions 
        WHERE created_at::date BETWEEN (start_date - (end_date - start_date)) AND start_date
        
        UNION ALL
        
        SELECT 
            'satisfaction' as category,
            'avg_satisfaction' as metric,
            AVG(CASE 
                WHEN sentiment = 'positive' THEN 5
                WHEN sentiment = 'neutral' THEN 3
                WHEN sentiment = 'negative' THEN 1
                ELSE 3
            END)::decimal as value
        FROM interactions 
        WHERE created_at::date BETWEEN (start_date - (end_date - start_date)) AND start_date
        AND sentiment IS NOT NULL
        
        UNION ALL
        
        SELECT 
            'ai' as category,
            'ai_queries' as metric,
            COUNT(*)::decimal as value
        FROM ai_responses 
        WHERE created_at::date BETWEEN (start_date - (end_date - start_date)) AND start_date
    )
    SELECT 
        c.category::text,
        c.metric::text,
        c.value as current_value,
        COALESCE(p.value, 0) as previous_value,
        CASE 
            WHEN COALESCE(p.value, 0) = 0 THEN 0
            ELSE ((c.value - COALESCE(p.value, 0)) / COALESCE(p.value, 1) * 100)
        END as change_percentage,
        CASE 
            WHEN c.value > COALESCE(p.value, 0) THEN 'up'
            WHEN c.value < COALESCE(p.value, 0) THEN 'down'
            ELSE 'stable'
        END::text as trend
    FROM current_period c
    LEFT JOIN previous_period p ON c.category = p.category AND c.metric = p.metric
    ORDER BY c.category, c.metric;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_advanced_clv TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_summary TO authenticated;