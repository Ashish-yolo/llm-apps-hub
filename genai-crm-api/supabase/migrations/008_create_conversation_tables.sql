-- Create conversation contexts table for conversation memory
CREATE TABLE IF NOT EXISTS conversation_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    turns JSONB DEFAULT '[]',
    summary TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT conversation_id_format CHECK (conversation_id ~* '^conv_[0-9]+_[a-z0-9]+$')
);

-- Create conversation archives table for old conversation turns
CREATE TABLE IF NOT EXISTS conversation_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id VARCHAR(100) NOT NULL,
    archived_turns JSONB NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key reference
    FOREIGN KEY (conversation_id) REFERENCES conversation_contexts(conversation_id) ON DELETE CASCADE
);

-- Create updated_at trigger for conversation_contexts
CREATE TRIGGER update_conversation_contexts_updated_at 
    BEFORE UPDATE ON conversation_contexts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_archives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_contexts
-- Allow users to read conversations they're involved in
CREATE POLICY "Allow users to read their conversations" 
    ON conversation_contexts FOR SELECT 
    TO authenticated 
    USING (
        agent_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow users to insert conversations
CREATE POLICY "Allow users to insert conversations" 
    ON conversation_contexts FOR INSERT 
    TO authenticated 
    WITH CHECK (agent_id = auth.uid());

-- Allow users to update their conversations
CREATE POLICY "Allow users to update their conversations" 
    ON conversation_contexts FOR UPDATE 
    TO authenticated 
    USING (
        agent_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow users to delete their conversations or admins
CREATE POLICY "Allow users to delete their conversations" 
    ON conversation_contexts FOR DELETE 
    TO authenticated 
    USING (
        agent_id = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- RLS Policies for conversation_archives
CREATE POLICY "Allow users to read their conversation archives" 
    ON conversation_archives FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM conversation_contexts cc 
            WHERE cc.conversation_id = conversation_archives.conversation_id 
            AND (cc.agent_id = auth.uid() OR (auth.jwt() ->> 'role')::text = 'admin')
        )
    );

CREATE POLICY "Allow users to insert conversation archives" 
    ON conversation_archives FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_contexts cc 
            WHERE cc.conversation_id = conversation_archives.conversation_id 
            AND cc.agent_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_conversation_contexts_conversation_id ON conversation_contexts(conversation_id);
CREATE INDEX idx_conversation_contexts_customer_id ON conversation_contexts(customer_id);
CREATE INDEX idx_conversation_contexts_agent_id ON conversation_contexts(agent_id);
CREATE INDEX idx_conversation_contexts_status ON conversation_contexts(status);
CREATE INDEX idx_conversation_contexts_updated_at ON conversation_contexts(updated_at);

CREATE INDEX idx_conversation_archives_conversation_id ON conversation_archives(conversation_id);
CREATE INDEX idx_conversation_archives_archived_at ON conversation_archives(archived_at);

-- Create GIN index for searching turns content
CREATE INDEX idx_conversation_contexts_turns ON conversation_contexts USING GIN(turns);

-- Enable real-time for conversation tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_contexts;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_archives;