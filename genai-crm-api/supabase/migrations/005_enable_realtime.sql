-- Enable real-time for all tables
-- This allows the frontend to subscribe to changes in real-time

-- Enable real-time on customers table
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

-- Enable real-time on interactions table  
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;

-- Enable real-time on ai_responses table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_responses;

-- Enable real-time on analytics table
ALTER PUBLICATION supabase_realtime ADD TABLE analytics;

-- Create a function to automatically set agent_id for interactions
CREATE OR REPLACE FUNCTION set_interaction_agent()
RETURNS TRIGGER AS $$
BEGIN
    -- Set agent_id to current user if not provided
    IF NEW.agent_id IS NULL THEN
        NEW.agent_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set agent_id
CREATE TRIGGER set_interaction_agent_trigger
    BEFORE INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION set_interaction_agent();

-- Create a function to automatically set user_id for ai_responses
CREATE OR REPLACE FUNCTION set_ai_response_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Set user_id to current user if not provided
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
CREATE TRIGGER set_ai_response_user_trigger
    BEFORE INSERT ON ai_responses
    FOR EACH ROW
    EXECUTE FUNCTION set_ai_response_user();

-- Create a function to automatically set created_by for customers
CREATE OR REPLACE FUNCTION set_customer_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by to current user if not provided
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set created_by
CREATE TRIGGER set_customer_created_by_trigger
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_created_by();