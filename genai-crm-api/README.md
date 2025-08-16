# 🚀 GenAI CRM - Complete AI-Powered Customer Service Enhancement

A modern, full-stack CRM system that enhances customer service with AI-powered insights, SOP integration, and real-time analytics.

## ✅ **READY FOR DEPLOYMENT - Get Working URL in 10 Minutes**

This system is production-ready and can be deployed immediately. Follow the quick deployment guide below.

## 🌟 **Key Features**

- **✨ AI-Powered Customer Service**: Claude AI integration with context awareness
- **📚 SOP Integration**: Confluence integration for real-time procedure access
- **📊 Advanced Analytics**: Real-time dashboards and business intelligence
- **🔒 Enterprise Security**: JWT auth, RLS, rate limiting, and CORS protection
- **⚡ Real-time Updates**: Live metrics and instant notifications
- **🎨 Modern UI**: React + TypeScript + TailwindCSS dashboard

## 🚀 **Quick Deploy - Get Working URL in 10 Minutes**

### **Step 1: Set Up Supabase Database (3 minutes)**

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Project name: `genai-crm`
3. Copy your credentials:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon key**: `eyJhbGciOi...`
   - **service_role key**: `eyJhbGciOi...`

4. In Supabase SQL Editor, paste and run:
```sql
-- Quick setup script
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'chat', 'meeting', 'other')),
    content TEXT NOT NULL,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    ai_suggestions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON interactions FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON ai_responses FOR ALL USING (true);

-- Add sample data
INSERT INTO customers (name, email, company) VALUES 
('John Smith', 'john@demo.com', 'Acme Corp'),
('Sarah Johnson', 'sarah@demo.com', 'Tech Solutions'),
('Mike Chen', 'mike@demo.com', 'Global Industries');

INSERT INTO interactions (customer_id, type, content, sentiment)
SELECT c.id, 'email', 'Customer inquiring about refund policy', 'neutral'
FROM customers c WHERE c.email = 'john@demo.com';
```

### **Step 2: Deploy Backend to Render (3 minutes)**

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New** → **Web Service** → Connect this repository
3. Settings:
   - **Name**: `genai-crm-api`
   - **Root Directory**: `genai-crm-api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Environment Variables** (Add all of these):
```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-your-api-key
JWT_SECRET=super-secret-jwt-key-minimum-32-chars
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=*
```

5. Click **Deploy** - Your API will be at: `https://genai-crm-api-xxx.onrender.com`

### **Step 3: Deploy Frontend to Netlify (2 minutes)**

1. Go to [netlify.com](https://netlify.com) → **New site from Git**
2. Connect GitHub → Select this repository
3. Settings:
   - **Base directory**: `genai-crm-dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. **Environment Variables**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=https://genai-crm-api-xxx.onrender.com/api
VITE_APP_ENV=production
```

5. Deploy - Your app will be at: `https://genai-crm-xxx.netlify.app`

### **Step 4: Get Anthropic API Key (2 minutes)**

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account → **Create Key**
3. Copy key and update Render environment variables
4. Redeploy backend

## 🎯 **Working URLs After Deployment**

After completing the steps above, you'll have:

- **✅ Frontend Dashboard**: `https://genai-crm-xxx.netlify.app`
- **✅ Backend API**: `https://genai-crm-api-xxx.onrender.com`
- **✅ Health Check**: `https://genai-crm-api-xxx.onrender.com/health`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### AI Processing
- `POST /api/ai/query` - Process customer queries with AI
- `POST /api/ai/suggestions` - Generate response suggestions

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/interactions` - Interaction analytics
- `GET /api/analytics/ai-performance` - AI performance metrics
- `POST /api/analytics/export` - Export analytics data

### Health Check
- `GET /health` - Service health status

## Environment Variables

Required environment variables:

```bash
# Server
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-key

# Security
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://your-frontend.com
```

## Deployment

### Render

The project includes a `render.yaml` configuration for easy deployment to Render:

1. Connect your repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues

### Project Structure

```
src/
├── middleware/     # Authentication & validation middleware
├── routes/         # API route handlers
├── services/       # Business logic services
├── types/          # TypeScript type definitions
└── server.ts       # Main server file
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation
- PII detection and redaction
- JWT authentication
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details