-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers table
-- Allow authenticated users to read all customers
CREATE POLICY "Allow authenticated users to read customers" 
    ON customers FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers" 
    ON customers FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update customers they created or admins
CREATE POLICY "Allow users to update their customers" 
    ON customers FOR UPDATE 
    TO authenticated 
    USING (
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow users to delete customers they created or admins
CREATE POLICY "Allow users to delete their customers" 
    ON customers FOR DELETE 
    TO authenticated 
    USING (
        created_by = auth.uid() OR 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_company ON customers(company) WHERE company IS NOT NULL;