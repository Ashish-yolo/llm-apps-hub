-- Create useful views for the CRM system

-- View for customer overview with latest interaction
CREATE OR REPLACE VIEW customer_overview AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company,
    c.created_at,
    c.updated_at,
    COALESCE(i.interaction_count, 0) as total_interactions,
    i.last_interaction_date,
    i.last_interaction_type,
    i.dominant_sentiment,
    ai.ai_query_count,
    ai.avg_confidence_score
FROM customers c
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as interaction_count,
        MAX(created_at) as last_interaction_date,
        (ARRAY_AGG(type ORDER BY created_at DESC))[1] as last_interaction_type,
        MODE() WITHIN GROUP (ORDER BY sentiment) as dominant_sentiment
    FROM interactions 
    WHERE sentiment IS NOT NULL
    GROUP BY customer_id
) i ON c.id = i.customer_id
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as ai_query_count,
        AVG(confidence_score) as avg_confidence_score
    FROM ai_responses 
    WHERE customer_id IS NOT NULL
    GROUP BY customer_id
) ai ON c.id = ai.customer_id;

-- View for interaction details with customer info
CREATE OR REPLACE VIEW interaction_details AS
SELECT 
    i.id,
    i.customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.company as customer_company,
    i.agent_id,
    u.email as agent_email,
    i.type,
    i.content,
    i.sentiment,
    i.ai_suggestions,
    i.metadata,
    i.created_at,
    i.updated_at,
    -- Calculate interaction value score
    CASE 
        WHEN i.sentiment = 'positive' THEN 3
        WHEN i.sentiment = 'neutral' THEN 2
        WHEN i.sentiment = 'negative' THEN 1
        ELSE 2
    END as sentiment_score
FROM interactions i
JOIN customers c ON i.customer_id = c.id
LEFT JOIN auth.users u ON i.agent_id = u.id;

-- View for AI response analytics
CREATE OR REPLACE VIEW ai_analytics AS
SELECT 
    ar.id,
    ar.user_id,
    u.email as user_email,
    ar.customer_id,
    c.name as customer_name,
    ar.query,
    ar.response,
    ar.confidence_score,
    ar.processing_time_ms,
    ar.model_version,
    ar.created_at,
    -- Performance categories
    CASE 
        WHEN ar.processing_time_ms < 1000 THEN 'fast'
        WHEN ar.processing_time_ms < 3000 THEN 'normal'
        ELSE 'slow'
    END as performance_category,
    CASE 
        WHEN ar.confidence_score >= 0.8 THEN 'high'
        WHEN ar.confidence_score >= 0.6 THEN 'medium'
        ELSE 'low'
    END as confidence_category
FROM ai_responses ar
LEFT JOIN auth.users u ON ar.user_id = u.id
LEFT JOIN customers c ON ar.customer_id = c.id;

-- Materialized view for daily metrics (refresh periodically)
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT 
    date_trunc('day', created_at)::date as metric_date,
    'customers_created' as metric_name,
    COUNT(*) as metric_value,
    jsonb_build_object('table', 'customers') as dimensions
FROM customers
GROUP BY date_trunc('day', created_at)::date

UNION ALL

SELECT 
    date_trunc('day', created_at)::date as metric_date,
    'interactions_created' as metric_name,
    COUNT(*) as metric_value,
    jsonb_build_object('table', 'interactions', 'type', type) as dimensions
FROM interactions
GROUP BY date_trunc('day', created_at)::date, type

UNION ALL

SELECT 
    date_trunc('day', created_at)::date as metric_date,
    'ai_queries_processed' as metric_name,
    COUNT(*) as metric_value,
    jsonb_build_object(
        'table', 'ai_responses',
        'avg_processing_time', AVG(processing_time_ms),
        'avg_confidence', AVG(confidence_score)
    ) as dimensions
FROM ai_responses
GROUP BY date_trunc('day', created_at)::date

ORDER BY metric_date DESC;

-- Create index on materialized view
CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);
CREATE INDEX idx_daily_metrics_name ON daily_metrics(metric_name);

-- Function to refresh daily metrics
CREATE OR REPLACE FUNCTION refresh_daily_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_metrics;
    
    -- Also record the refresh in analytics table
    PERFORM record_metric(
        'materialized_view_refresh',
        1,
        jsonb_build_object('view_name', 'daily_metrics'),
        CURRENT_DATE,
        EXTRACT(HOUR FROM NOW())::INTEGER
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to automatically refresh metrics daily
CREATE OR REPLACE FUNCTION schedule_daily_refresh()
RETURNS VOID AS $$
BEGIN
    -- This would typically be called by a cron job or scheduled task
    PERFORM refresh_daily_metrics();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on views
GRANT SELECT ON customer_overview TO authenticated;
GRANT SELECT ON interaction_details TO authenticated;
GRANT SELECT ON ai_analytics TO authenticated;
GRANT SELECT ON daily_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_daily_metrics TO authenticated;

-- Row Level Security for views (inherit from base tables)
ALTER MATERIALIZED VIEW daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read daily_metrics" 
    ON daily_metrics FOR SELECT 
    TO authenticated 
    USING (true);