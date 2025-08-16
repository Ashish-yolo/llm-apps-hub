-- Create tables for analytics and reporting system

-- Table for storing generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('performance', 'customer', 'ai', 'business', 'custom')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    charts JSONB DEFAULT '[]',
    period_start DATE,
    period_end DATE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Table for scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('performance', 'customer', 'ai', 'business', 'custom')),
    schedule JSONB NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    run_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_schedule CHECK (
        jsonb_typeof(schedule) = 'object' AND
        schedule ? 'frequency' AND
        schedule->>'frequency' IN ('daily', 'weekly', 'monthly')
    )
);

-- Table for report templates
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sections JSONB NOT NULL DEFAULT '[]',
    layout JSONB NOT NULL DEFAULT '{}',
    styling JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0
);

-- Table for report exports
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
    file_size INTEGER,
    file_path TEXT,
    download_url TEXT,
    exported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key
    FOREIGN KEY (report_id) REFERENCES generated_reports(report_id) ON DELETE CASCADE
);

-- Table for alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('greater_than', 'less_than', 'equals', 'change_percentage')),
    threshold DECIMAL(15,4) NOT NULL,
    time_window_minutes INTEGER NOT NULL DEFAULT 60,
    notification_channels JSONB DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0
);

-- Table for alert triggers (when alerts fire)
CREATE TABLE IF NOT EXISTS alert_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    alert_name VARCHAR(200) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    threshold DECIMAL(15,4) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    
    -- Foreign key
    FOREIGN KEY (alert_id) REFERENCES alert_rules(alert_id) ON DELETE CASCADE
);

-- Table for business intelligence queries
CREATE TABLE IF NOT EXISTS bi_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sql_query TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    result_schema JSONB DEFAULT '{}',
    cache_duration_minutes INTEGER DEFAULT 60,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false
);

-- Table for storing BI query results cache
CREATE TABLE IF NOT EXISTS bi_query_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id VARCHAR(100) NOT NULL,
    parameters_hash VARCHAR(64) NOT NULL,
    result_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Foreign key
    FOREIGN KEY (query_id) REFERENCES bi_queries(query_id) ON DELETE CASCADE,
    
    -- Unique constraint for cache keys
    UNIQUE(query_id, parameters_hash)
);

-- Create updated_at triggers
CREATE TRIGGER update_report_templates_updated_at 
    BEFORE UPDATE ON report_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bi_queries_updated_at 
    BEFORE UPDATE ON bi_queries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_query_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_reports
CREATE POLICY "Allow users to read their reports or public reports" 
    ON generated_reports FOR SELECT 
    TO authenticated 
    USING (
        generated_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

CREATE POLICY "Allow users to insert reports" 
    ON generated_reports FOR INSERT 
    TO authenticated 
    WITH CHECK (generated_by = auth.uid());

-- RLS Policies for scheduled_reports
CREATE POLICY "Allow users to manage their scheduled reports" 
    ON scheduled_reports FOR ALL 
    TO authenticated 
    USING (
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- RLS Policies for report_templates
CREATE POLICY "Allow users to read public templates or their own" 
    ON report_templates FOR SELECT 
    TO authenticated 
    USING (
        is_public = true OR 
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

CREATE POLICY "Allow users to manage their templates" 
    ON report_templates FOR INSERT 
    TO authenticated 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to update their templates" 
    ON report_templates FOR UPDATE 
    TO authenticated 
    USING (
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- RLS Policies for report_exports
CREATE POLICY "Allow users to access their report exports" 
    ON report_exports FOR ALL 
    TO authenticated 
    USING (
        exported_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM generated_reports gr 
            WHERE gr.report_id = report_exports.report_id 
            AND (gr.generated_by = auth.uid() OR (auth.jwt() ->> 'role')::text = 'admin')
        )
    );

-- RLS Policies for alert_rules
CREATE POLICY "Allow users to manage their alerts" 
    ON alert_rules FOR ALL 
    TO authenticated 
    USING (
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- RLS Policies for alert_triggers
CREATE POLICY "Allow users to view alert triggers" 
    ON alert_triggers FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM alert_rules ar 
            WHERE ar.alert_id = alert_triggers.alert_id 
            AND (ar.created_by = auth.uid() OR (auth.jwt() ->> 'role')::text = 'admin')
        )
    );

CREATE POLICY "Allow system to insert alert triggers" 
    ON alert_triggers FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- RLS Policies for bi_queries
CREATE POLICY "Allow users to read public queries or their own" 
    ON bi_queries FOR SELECT 
    TO authenticated 
    USING (
        is_public = true OR 
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

CREATE POLICY "Allow users to manage their BI queries" 
    ON bi_queries FOR INSERT 
    TO authenticated 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to update their BI queries" 
    ON bi_queries FOR UPDATE 
    TO authenticated 
    USING (
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- RLS Policies for bi_query_cache
CREATE POLICY "Allow access to BI query cache" 
    ON bi_query_cache FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM bi_queries bq 
            WHERE bq.query_id = bi_query_cache.query_id 
            AND (bq.is_public = true OR bq.created_by = auth.uid() OR (auth.jwt() ->> 'role')::text = 'admin')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_generated_reports_report_id ON generated_reports(report_id);
CREATE INDEX idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX idx_generated_reports_generated_by ON generated_reports(generated_by);
CREATE INDEX idx_generated_reports_generated_at ON generated_reports(generated_at);

CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run) WHERE enabled = true;
CREATE INDEX idx_scheduled_reports_created_by ON scheduled_reports(created_by);

CREATE INDEX idx_report_templates_public ON report_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);

CREATE INDEX idx_report_exports_report_id ON report_exports(report_id);
CREATE INDEX idx_report_exports_exported_by ON report_exports(exported_by);
CREATE INDEX idx_report_exports_expires_at ON report_exports(expires_at);

CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_alert_rules_metric_name ON alert_rules(metric_name);
CREATE INDEX idx_alert_rules_created_by ON alert_rules(created_by);

CREATE INDEX idx_alert_triggers_alert_id ON alert_triggers(alert_id);
CREATE INDEX idx_alert_triggers_triggered_at ON alert_triggers(triggered_at);
CREATE INDEX idx_alert_triggers_metric_name ON alert_triggers(metric_name);

CREATE INDEX idx_bi_queries_category ON bi_queries(category);
CREATE INDEX idx_bi_queries_public ON bi_queries(is_public) WHERE is_public = true;
CREATE INDEX idx_bi_queries_created_by ON bi_queries(created_by);

CREATE INDEX idx_bi_query_cache_expires_at ON bi_query_cache(expires_at);
CREATE INDEX idx_bi_query_cache_query_params ON bi_query_cache(query_id, parameters_hash);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_generated_reports_data ON generated_reports USING GIN(data);
CREATE INDEX idx_generated_reports_charts ON generated_reports USING GIN(charts);
CREATE INDEX idx_scheduled_reports_schedule ON scheduled_reports USING GIN(schedule);
CREATE INDEX idx_scheduled_reports_filters ON scheduled_reports USING GIN(filters);
CREATE INDEX idx_alert_rules_channels ON alert_rules USING GIN(notification_channels);
CREATE INDEX idx_bi_queries_parameters ON bi_queries USING GIN(parameters);
CREATE INDEX idx_bi_query_cache_result ON bi_query_cache USING GIN(result_data);

-- Enable real-time for analytics tables
ALTER PUBLICATION supabase_realtime ADD TABLE generated_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE alert_triggers;
ALTER PUBLICATION supabase_realtime ADD TABLE bi_query_cache;