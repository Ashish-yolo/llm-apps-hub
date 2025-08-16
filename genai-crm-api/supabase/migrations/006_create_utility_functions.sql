-- Utility functions for the CRM system

-- Function to get customer interaction summary
CREATE OR REPLACE FUNCTION get_customer_interaction_summary(customer_uuid UUID)
RETURNS TABLE (
    total_interactions BIGINT,
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    sentiment_distribution JSONB,
    interaction_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_interactions,
        MAX(i.created_at) as last_interaction_date,
        jsonb_build_object(
            'positive', COUNT(*) FILTER (WHERE i.sentiment = 'positive'),
            'neutral', COUNT(*) FILTER (WHERE i.sentiment = 'neutral'),
            'negative', COUNT(*) FILTER (WHERE i.sentiment = 'negative')
        ) as sentiment_distribution,
        jsonb_object_agg(i.type, type_count) as interaction_types
    FROM interactions i
    LEFT JOIN (
        SELECT type, COUNT(*) as type_count
        FROM interactions 
        WHERE customer_id = customer_uuid
        GROUP BY type
    ) type_counts ON i.type = type_counts.type
    WHERE i.customer_id = customer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate AI performance metrics
CREATE OR REPLACE FUNCTION get_ai_performance_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_queries BIGINT,
    avg_processing_time DECIMAL,
    avg_confidence_score DECIMAL,
    queries_by_day JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_queries,
        AVG(ar.processing_time_ms) as avg_processing_time,
        AVG(ar.confidence_score) as avg_confidence_score,
        jsonb_object_agg(
            date_trunc('day', ar.created_at)::date, 
            daily_count
        ) as queries_by_day
    FROM ai_responses ar
    LEFT JOIN (
        SELECT 
            date_trunc('day', created_at)::date as query_date,
            COUNT(*) as daily_count
        FROM ai_responses 
        WHERE created_at::date BETWEEN start_date AND end_date
        GROUP BY date_trunc('day', created_at)::date
    ) daily_stats ON date_trunc('day', ar.created_at)::date = daily_stats.query_date
    WHERE ar.created_at::date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record analytics metrics
CREATE OR REPLACE FUNCTION record_metric(
    p_metric_name VARCHAR(100),
    p_metric_value DECIMAL(15,4),
    p_dimensions JSONB DEFAULT '{}',
    p_date DATE DEFAULT CURRENT_DATE,
    p_hour INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO analytics (
        metric_name, 
        metric_value, 
        dimensions, 
        date, 
        hour
    ) VALUES (
        p_metric_name, 
        p_metric_value, 
        p_dimensions, 
        p_date, 
        p_hour
    )
    ON CONFLICT (metric_name, date, hour, organization_id) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        dimensions = EXCLUDED.dimensions,
        updated_at = NOW()
    RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate customer lifetime value (placeholder)
CREATE OR REPLACE FUNCTION calculate_customer_value(customer_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    interaction_count INTEGER;
    value_score DECIMAL DEFAULT 0;
BEGIN
    SELECT COUNT(*) INTO interaction_count
    FROM interactions 
    WHERE customer_id = customer_uuid;
    
    -- Simple scoring based on interaction count (can be enhanced)
    value_score := interaction_count * 10.0;
    
    -- Bonus for positive sentiment
    SELECT value_score + (COUNT(*) * 5.0) INTO value_score
    FROM interactions 
    WHERE customer_id = customer_uuid AND sentiment = 'positive';
    
    RETURN COALESCE(value_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_customers', (SELECT COUNT(*) FROM customers WHERE created_at::date BETWEEN start_date AND end_date),
        'total_interactions', (SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN start_date AND end_date),
        'total_ai_queries', (SELECT COUNT(*) FROM ai_responses WHERE created_at::date BETWEEN start_date AND end_date),
        'avg_response_time', (SELECT AVG(processing_time_ms) FROM ai_responses WHERE created_at::date BETWEEN start_date AND end_date),
        'sentiment_breakdown', (
            SELECT jsonb_build_object(
                'positive', COUNT(*) FILTER (WHERE sentiment = 'positive'),
                'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral'),
                'negative', COUNT(*) FILTER (WHERE sentiment = 'negative')
            )
            FROM interactions 
            WHERE created_at::date BETWEEN start_date AND end_date
        ),
        'interaction_types', (
            SELECT jsonb_object_agg(type, count)
            FROM (
                SELECT type, COUNT(*) as count
                FROM interactions 
                WHERE created_at::date BETWEEN start_date AND end_date
                GROUP BY type
            ) type_counts
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_customer_interaction_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION record_metric TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_customer_value TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO authenticated;