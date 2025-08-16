# GenAI CRM Deployment Guide

This guide will help you deploy the complete GenAI CRM system with a working URL.

## Prerequisites

Before deploying, you'll need:

1. **Supabase Account** (free tier available)
2. **Render Account** (free tier available) 
3. **Netlify Account** (free tier available)
4. **Anthropic API Key** (Claude access)
5. **Confluence API Token** (optional, for SOP integration)

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - **Name**: `genai-crm`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Wait for project to be ready (2-3 minutes)

### 1.2 Get Supabase Credentials

From your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY) 
   - **service_role** key (SUPABASE_SERVICE_KEY)

### 1.3 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Run each migration file in order:

**Migration 1: Customers Table**
```sql
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_company ON customers(company);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE
    ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Migration 2: Interactions Table**
```sql
-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'chat', 'meeting', 'other')),
    content TEXT NOT NULL,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    ai_suggestions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON interactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON interactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);
CREATE INDEX idx_interactions_agent_id ON interactions(agent_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_sentiment ON interactions(sentiment);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE
    ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Migration 3: AI Responses Table**
```sql
-- Create ai_responses table
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    intent TEXT,
    sentiment TEXT,
    customer_id UUID REFERENCES customers(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON ai_responses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON ai_responses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_ai_responses_user_id ON ai_responses(user_id);
CREATE INDEX idx_ai_responses_customer_id ON ai_responses(customer_id);
CREATE INDEX idx_ai_responses_intent ON ai_responses(intent);
CREATE INDEX idx_ai_responses_sentiment ON ai_responses(sentiment);
CREATE INDEX idx_ai_responses_created_at ON ai_responses(created_at);
```

**Migration 4: Enable Realtime**
```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_responses;
```

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### 2.2 Deploy from GitHub

1. Push your code to GitHub repository
2. In Render dashboard, click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure deployment:
   - **Name**: `genai-crm-api`
   - **Branch**: `main`
   - **Root Directory**: `genai-crm-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2.3 Set Environment Variables

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
JWT_SECRET=your-super-secret-jwt-key-256-bit-minimum
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://genai-crm-dashboard.netlify.app
```

**Optional Confluence Variables:**
```env
CONFLUENCE_BASE_URL=https://your-company.atlassian.net
CONFLUENCE_API_TOKEN=your-confluence-api-token
CONFLUENCE_USERNAME=your-confluence-username
```

### 2.4 Deploy

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Your API will be available at: `https://genai-crm-api.onrender.com`

## Step 3: Deploy Frontend to Netlify

### 3.1 Update Environment Variables

Update the frontend `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://genai-crm-api.onrender.com/api
VITE_APP_ENV=production
VITE_APP_NAME=GenAI CRM Dashboard
VITE_APP_VERSION=1.0.0
```

### 3.2 Build and Deploy

1. Test build locally:
```bash
cd genai-crm-dashboard
npm run build
```

2. Deploy to Netlify:
   - Option A: **Drag & Drop** the `dist` folder to netlify.com
   - Option B: **Connect GitHub** repository

### 3.3 Netlify Configuration

If using GitHub deployment:
1. In Netlify dashboard, click **New site from Git**
2. Choose your GitHub repository
3. Configure build settings:
   - **Base directory**: `genai-crm-dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. Add environment variables in Netlify dashboard

### 3.4 Custom Domain (Optional)

1. In Netlify dashboard, go to **Domain settings**
2. Add custom domain or use the provided `.netlify.app` domain

## Step 4: Test the Deployment

### 4.1 Test Backend API

Visit: `https://genai-crm-api.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### 4.2 Test Frontend

Visit: `https://your-app.netlify.app`

You should see:
- Login page
- Ability to sign up for new account
- Dashboard after authentication

### 4.3 Test Full Integration

1. Create a new account
2. Access the dashboard
3. Try the AI chat feature
4. Verify SOP integration (if Confluence configured)

## Step 5: Post-Deployment Configuration

### 5.1 Create Sample Data

In Supabase SQL Editor, run:

```sql
-- Insert sample customer
INSERT INTO customers (name, email, company) VALUES 
('John Smith', 'john@example.com', 'Acme Corp'),
('Sarah Johnson', 'sarah@example.com', 'Tech Solutions'),
('Mike Chen', 'mike@example.com', 'Global Industries');

-- Insert sample interaction
INSERT INTO interactions (customer_id, type, content, sentiment)
SELECT 
    c.id,
    'email',
    'Customer inquiring about refund policy for recent purchase',
    'neutral'
FROM customers c
WHERE c.email = 'john@example.com';
```

### 5.2 Configure CORS (if needed)

Update the `ALLOWED_ORIGINS` environment variable in Render to include your Netlify domain.

### 5.3 Monitor Logs

- **Render**: Check logs in dashboard for API errors
- **Netlify**: Check function logs and deploy logs
- **Supabase**: Monitor database performance

## Working URLs

After successful deployment, you'll have:

- **Frontend**: `https://your-app.netlify.app`
- **Backend API**: `https://genai-crm-api.onrender.com`
- **Supabase Dashboard**: `https://app.supabase.com/project/your-project-id`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify all dependencies installed
   - Check TypeScript compilation

2. **API Connection Issues**
   - Verify environment variables
   - Check CORS configuration
   - Confirm Supabase credentials

3. **Authentication Issues**
   - Check Supabase RLS policies
   - Verify JWT configuration
   - Test with simple queries first

### Getting Help

1. Check server logs in Render dashboard
2. Monitor network requests in browser dev tools
3. Test API endpoints with Postman/curl
4. Verify Supabase table permissions

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys
2. **CORS**: Restrict to your domains only
3. **Rate Limiting**: Monitor API usage
4. **Database**: Use RLS policies properly
5. **API Keys**: Rotate keys regularly

## Scaling Considerations

1. **Render**: Upgrade to paid plan for production
2. **Supabase**: Monitor database performance
3. **Netlify**: CDN handles frontend scaling
4. **Anthropic**: Monitor API usage and costs

Your GenAI CRM system is now live and ready for use!