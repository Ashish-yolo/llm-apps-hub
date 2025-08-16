#!/bin/bash

# GenAI CRM One-Click Deployment Script
# This script automates the deployment process

set -e

echo "🚀 GenAI CRM Deployment Script"
echo "================================"

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ git is required but not installed. Aborting." >&2; exit 1; }

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Pre-deployment Checklist${NC}"
echo "Before proceeding, ensure you have:"
echo "✓ Supabase account and project created"
echo "✓ Anthropic API key"
echo "✓ Render account"
echo "✓ Netlify account"
echo "✓ (Optional) Confluence API token"
echo ""

read -p "Do you have all the above requirements? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please complete the requirements first${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Collecting Configuration...${NC}"

# Collect environment variables
read -p "Enter your Supabase Project URL: " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
read -s -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_KEY
echo
read -s -p "Enter your Anthropic API Key: " ANTHROPIC_API_KEY
echo

# Optional Confluence configuration
read -p "Do you want to configure Confluence integration? (y/n): " -n 1 -r CONFLUENCE_SETUP
echo
if [[ $CONFLUENCE_SETUP =~ ^[Yy]$ ]]; then
    read -p "Enter your Confluence Base URL (e.g., https://company.atlassian.net): " CONFLUENCE_BASE_URL
    read -p "Enter your Confluence Username: " CONFLUENCE_USERNAME
    read -s -p "Enter your Confluence API Token: " CONFLUENCE_API_TOKEN
    echo
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s)-$(whoami)-secret-key-$(hostname)")

echo -e "${BLUE}🔧 Preparing Backend...${NC}"

cd genai-crm-api

# Create production .env file
cat > .env << EOF
NODE_ENV=production
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
JWT_SECRET=${JWT_SECRET}
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF

if [[ $CONFLUENCE_SETUP =~ ^[Yy]$ ]]; then
    cat >> .env << EOF
CONFLUENCE_BASE_URL=${CONFLUENCE_BASE_URL}
CONFLUENCE_USERNAME=${CONFLUENCE_USERNAME}
CONFLUENCE_API_TOKEN=${CONFLUENCE_API_TOKEN}
EOF
fi

# Install dependencies and build
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Building backend...${NC}"
npm run build

echo -e "${GREEN}✅ Backend prepared successfully${NC}"

cd ..

echo -e "${BLUE}🎨 Preparing Frontend...${NC}"

cd genai-crm-dashboard

# Create production .env file for frontend
cat > .env << EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_ENV=development
VITE_APP_NAME=GenAI CRM Dashboard
VITE_APP_VERSION=1.0.0
EOF

# Install dependencies and build
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

echo -e "${GREEN}✅ Frontend prepared successfully${NC}"

cd ..

echo -e "${BLUE}📚 Generating Deployment Instructions...${NC}"

# Create a deployment summary
cat > DEPLOYMENT_SUMMARY.md << EOF
# Deployment Summary

Your GenAI CRM system has been prepared for deployment.

## Next Steps:

### 1. Deploy Backend to Render
1. Push this repository to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service from GitHub repo
4. Set Root Directory to: \`genai-crm-api\`
5. Add these environment variables in Render:

\`\`\`
NODE_ENV=production
PORT=10000
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
JWT_SECRET=${JWT_SECRET}
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://your-netlify-domain.netlify.app
EOF

if [[ $CONFLUENCE_SETUP =~ ^[Yy]$ ]]; then
    cat >> DEPLOYMENT_SUMMARY.md << EOF
CONFLUENCE_BASE_URL=${CONFLUENCE_BASE_URL}
CONFLUENCE_USERNAME=${CONFLUENCE_USERNAME}
CONFLUENCE_API_TOKEN=${CONFLUENCE_API_TOKEN}
EOF
fi

cat >> DEPLOYMENT_SUMMARY.md << EOF
\`\`\`

### 2. Deploy Frontend to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop the \`genai-crm-dashboard/dist\` folder
3. Or connect GitHub and set:
   - Base directory: \`genai-crm-dashboard\`
   - Build command: \`npm run build\`
   - Publish directory: \`dist\`

### 3. Update Frontend Config
After deploying backend, update frontend .env:
\`\`\`
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
\`\`\`

### 4. Set Up Database
Run the SQL migrations in your Supabase dashboard (see DEPLOYMENT_GUIDE.md)

## Test URLs:
- Backend Health: https://your-render-app.onrender.com/health
- Frontend: https://your-netlify-app.netlify.app

Generated on: $(date)
EOF

echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✓ Backend built and configured"
echo "✓ Frontend built and configured"
echo "✓ Environment variables prepared"
echo "✓ Deployment instructions generated"
echo ""
echo -e "${YELLOW}📖 Next steps:${NC}"
echo "1. Review DEPLOYMENT_SUMMARY.md"
echo "2. Push to GitHub"
echo "3. Deploy to Render & Netlify"
echo "4. Set up Supabase database"
echo ""
echo -e "${GREEN}🚀 Happy deploying!${NC}"
EOF