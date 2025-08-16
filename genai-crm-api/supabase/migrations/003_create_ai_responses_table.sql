-- Create ai_responses table
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER NOT NULL CHECK (processing_time_ms >= 0),
    model_version VARCHAR(50) DEFAULT 'claude-3-sonnet-20240229',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT query_not_empty CHECK (LENGTH(TRIM(query)) > 0),
    CONSTRAINT response_not_empty CHECK (LENGTH(TRIM(response)) > 0),
    CONSTRAINT query_max_length CHECK (LENGTH(query) <= 2000),
    CONSTRAINT response_max_length CHECK (LENGTH(response) <= 5000)
);

-- Enable Row Level Security
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_responses table
-- Allow users to read their own AI responses
CREATE POLICY "Allow users to read their ai_responses" 
    ON ai_responses FOR SELECT 
    TO authenticated 
    USING (
        user_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow authenticated users to insert AI responses
CREATE POLICY "Allow authenticated users to insert ai_responses" 
    ON ai_responses FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- Only allow users to update their own AI responses
CREATE POLICY "Allow users to update their ai_responses" 
    ON ai_responses FOR UPDATE 
    TO authenticated 
    USING (
        user_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow users to delete their own AI responses or admins
CREATE POLICY "Allow users to delete their ai_responses" 
    ON ai_responses FOR DELETE 
    TO authenticated 
    USING (
        user_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Create indexes for performance
CREATE INDEX idx_ai_responses_user_id ON ai_responses(user_id);
CREATE INDEX idx_ai_responses_customer_id ON ai_responses(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_ai_responses_interaction_id ON ai_responses(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_ai_responses_created_at ON ai_responses(created_at);
CREATE INDEX idx_ai_responses_processing_time ON ai_responses(processing_time_ms);
CREATE INDEX idx_ai_responses_confidence ON ai_responses(confidence_score) WHERE confidence_score IS NOT NULL;
CREATE INDEX idx_ai_responses_user_date ON ai_responses(user_id, created_at DESC);