-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone', 'chat', 'meeting', 'other')),
    content TEXT NOT NULL,
    sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    ai_suggestions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT content_max_length CHECK (LENGTH(content) <= 5000)
);

-- Create updated_at trigger for interactions
CREATE TRIGGER update_interactions_updated_at 
    BEFORE UPDATE ON interactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interactions table
-- Allow authenticated users to read all interactions
CREATE POLICY "Allow authenticated users to read interactions" 
    ON interactions FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert interactions
CREATE POLICY "Allow authenticated users to insert interactions" 
    ON interactions FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update interactions they created or admins
CREATE POLICY "Allow users to update their interactions" 
    ON interactions FOR UPDATE 
    TO authenticated 
    USING (
        agent_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow users to delete interactions they created or admins
CREATE POLICY "Allow users to delete their interactions" 
    ON interactions FOR DELETE 
    TO authenticated 
    USING (
        agent_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Create indexes for performance
CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);
CREATE INDEX idx_interactions_agent_id ON interactions(agent_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_sentiment ON interactions(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX idx_interactions_created_at ON interactions(created_at);
CREATE INDEX idx_interactions_customer_date ON interactions(customer_id, created_at DESC);