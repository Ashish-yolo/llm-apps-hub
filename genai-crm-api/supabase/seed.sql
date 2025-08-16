-- Seed data for development and testing
-- This file provides sample data to test the CRM system

-- Insert sample customers
INSERT INTO customers (name, email, phone, company, metadata) VALUES
('John Smith', 'john.smith@example.com', '+1-555-0101', 'Tech Corp', '{"source": "website", "tier": "premium"}'),
('Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', 'Marketing Plus', '{"source": "referral", "tier": "standard"}'),
('Michael Brown', 'michael.brown@example.com', '+1-555-0103', 'Design Studio', '{"source": "social_media", "tier": "premium"}'),
('Emily Davis', 'emily.davis@example.com', '+1-555-0104', 'Consulting Group', '{"source": "direct", "tier": "enterprise"}'),
('David Wilson', 'david.wilson@example.com', '+1-555-0105', 'Startup Inc', '{"source": "website", "tier": "standard"}'),
('Lisa Garcia', 'lisa.garcia@example.com', '+1-555-0106', 'E-commerce Solutions', '{"source": "referral", "tier": "premium"}'),
('Robert Martinez', 'robert.martinez@example.com', '+1-555-0107', 'Financial Services', '{"source": "conference", "tier": "enterprise"}'),
('Jennifer Lee', 'jennifer.lee@example.com', '+1-555-0108', 'Healthcare Systems', '{"source": "cold_call", "tier": "standard"}');

-- Insert sample interactions (using customer IDs from above)
INSERT INTO interactions (customer_id, type, content, sentiment, metadata) 
SELECT 
    c.id,
    (ARRAY['email', 'phone', 'chat', 'meeting'])[floor(random() * 4 + 1)],
    CASE 
        WHEN random() < 0.33 THEN 'I love your product! It has exceeded my expectations.'
        WHEN random() < 0.66 THEN 'I have a question about my account settings. Can you help?'
        ELSE 'I am experiencing some issues with the login process. Please assist.'
    END,
    (ARRAY['positive', 'neutral', 'negative'])[floor(random() * 3 + 1)],
    jsonb_build_object(
        'channel', (ARRAY['web', 'mobile', 'phone'])[floor(random() * 3 + 1)],
        'priority', (ARRAY['low', 'medium', 'high'])[floor(random() * 3 + 1)]
    )
FROM customers c
CROSS JOIN generate_series(1, 3) -- 3 interactions per customer
LIMIT 24;

-- Insert sample AI responses
INSERT INTO ai_responses (customer_id, query, response, confidence_score, processing_time_ms, metadata)
SELECT 
    c.id,
    'How can I help this customer with their inquiry?',
    'Based on the customer''s history and current inquiry, I recommend a personalized approach focusing on their specific needs. Here are three response options: 1) Direct solution, 2) Detailed explanation, 3) Escalation if needed.',
    0.75 + (random() * 0.25), -- Confidence between 0.75 and 1.0
    500 + floor(random() * 2000), -- Processing time between 500-2500ms
    jsonb_build_object(
        'model_temperature', 0.7,
        'max_tokens', 1000,
        'approach', (ARRAY['direct', 'empathetic', 'technical'])[floor(random() * 3 + 1)]
    )
FROM customers c
LIMIT 15;

-- Insert sample analytics data for the last 30 days
INSERT INTO analytics (metric_name, metric_value, dimensions, date, hour)
SELECT 
    metric_name,
    metric_value,
    dimensions,
    date_val,
    hour_val
FROM (
    SELECT 
        'daily_interactions' as metric_name,
        floor(random() * 50 + 10) as metric_value,
        jsonb_build_object('type', interaction_type) as dimensions,
        CURRENT_DATE - (generate_series(0, 29) * interval '1 day')::date as date_val,
        NULL as hour_val,
        unnest(ARRAY['email', 'phone', 'chat', 'meeting']) as interaction_type
    FROM generate_series(0, 29)
    
    UNION ALL
    
    SELECT 
        'hourly_ai_queries' as metric_name,
        floor(random() * 20 + 1) as metric_value,
        jsonb_build_object('hour', hour_num) as dimensions,
        CURRENT_DATE as date_val,
        hour_num as hour_val,
        'ai_query' as interaction_type
    FROM generate_series(9, 17) as hour_num -- Business hours
    
    UNION ALL
    
    SELECT 
        'customer_satisfaction' as metric_name,
        3.5 + (random() * 1.5) as metric_value,
        jsonb_build_object('scale', '1-5', 'survey_type', 'post_interaction') as dimensions,
        CURRENT_DATE - (generate_series(0, 6) * interval '1 day')::date as date_val,
        NULL as hour_val,
        'satisfaction' as interaction_type
    FROM generate_series(0, 6)
) seed_data;

-- Refresh the materialized view with new data
SELECT refresh_daily_metrics();

-- Create some sample AI response data linked to interactions
UPDATE interactions 
SET ai_suggestions = jsonb_build_array(
    jsonb_build_object(
        'type', 'direct',
        'text', 'Thank you for reaching out. Let me help you resolve this issue immediately.',
        'confidence', 0.85
    ),
    jsonb_build_object(
        'type', 'detailed', 
        'text', 'I understand your concern and would like to provide you with a comprehensive solution. Here are the steps we can take together...',
        'confidence', 0.78
    ),
    jsonb_build_object(
        'type', 'empathetic',
        'text', 'I really appreciate you bringing this to our attention. Your experience matters to us, and I want to make sure we address this properly.',
        'confidence', 0.82
    )
)
WHERE random() < 0.3; -- Only update 30% of interactions

-- Add some metadata to customers for testing
UPDATE customers 
SET metadata = metadata || jsonb_build_object(
    'last_login', NOW() - (random() * interval '30 days'),
    'preferred_contact', (ARRAY['email', 'phone', 'chat'])[floor(random() * 3 + 1)],
    'lifetime_value', floor(random() * 10000 + 1000)
)
WHERE random() < 0.8; -- Update 80% of customers

-- Insert some performance analytics
INSERT INTO analytics (metric_name, metric_value, dimensions, date) VALUES
('total_customers', (SELECT COUNT(*) FROM customers), '{"source": "database_count"}', CURRENT_DATE),
('total_interactions', (SELECT COUNT(*) FROM interactions), '{"source": "database_count"}', CURRENT_DATE),
('total_ai_responses', (SELECT COUNT(*) FROM ai_responses), '{"source": "database_count"}', CURRENT_DATE),
('avg_ai_processing_time', (SELECT AVG(processing_time_ms) FROM ai_responses), '{"source": "calculated", "unit": "milliseconds"}', CURRENT_DATE),
('avg_ai_confidence', (SELECT AVG(confidence_score) FROM ai_responses), '{"source": "calculated", "scale": "0-1"}', CURRENT_DATE);