-- Create analytics table for storing metrics and KPIs
CREATE TABLE IF NOT EXISTS analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    organization_id UUID, -- For multi-tenant support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT metric_name_not_empty CHECK (LENGTH(TRIM(metric_name)) > 0),
    
    -- Unique constraint to prevent duplicate metrics for same time period
    UNIQUE(metric_name, date, hour, organization_id)
);

-- Create updated_at trigger for analytics
CREATE TRIGGER update_analytics_updated_at 
    BEFORE UPDATE ON analytics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics table
-- Allow authenticated users to read analytics (could be restricted by organization later)
CREATE POLICY "Allow authenticated users to read analytics" 
    ON analytics FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert analytics
CREATE POLICY "Allow authenticated users to insert analytics" 
    ON analytics FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update analytics
CREATE POLICY "Allow admins to update analytics" 
    ON analytics FOR UPDATE 
    TO authenticated 
    USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Only admins can delete analytics
CREATE POLICY "Allow admins to delete analytics" 
    ON analytics FOR DELETE 
    TO authenticated 
    USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create indexes for performance
CREATE INDEX idx_analytics_metric_name ON analytics(metric_name);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_analytics_metric_date ON analytics(metric_name, date DESC);
CREATE INDEX idx_analytics_organization ON analytics(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_analytics_hour ON analytics(hour) WHERE hour IS NOT NULL;

-- Create a composite index for time-series queries
CREATE INDEX idx_analytics_timeseries ON analytics(metric_name, date DESC, hour DESC);

-- Create GIN index for dimensions JSONB queries
CREATE INDEX idx_analytics_dimensions ON analytics USING GIN(dimensions);