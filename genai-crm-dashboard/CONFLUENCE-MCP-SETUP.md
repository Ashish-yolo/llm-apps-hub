# 🔗 Confluence MCP Integration Setup Guide

## 🎯 Overview

This guide will help you set up the Confluence MCP (Model Context Protocol) integration to power your AI Assistant with live Customer Support SOPs from Confluence.

## ✅ What You'll Get

- **Live SOP Integration**: AI responses based on your actual Confluence SOPs
- **Real-time Sync**: Automatic updates when SOPs change in Confluence
- **Smart Search**: Semantic search across all your customer support procedures
- **Source Attribution**: Every AI response links back to specific SOPs
- **Quality Metrics**: Track SOP freshness and relevance

## 📋 Prerequisites

1. **Confluence Account**: Admin access to your Confluence instance
2. **Customer Support Space**: A dedicated Confluence space for SOPs (recommended: "CS")
3. **API Token**: Confluence API token for service account
4. **Anthropic API Key**: For Claude AI processing (optional - will use mock responses without it)

## 🔧 Step 1: Confluence Setup

### 1.1 Create Service Account

1. Go to your Atlassian Admin Console
2. Navigate to **Users** → **Create User**
3. Create a service account (e.g., `ai-assistant@yourcompany.com`)
4. Grant the service account **Read** access to your Customer Support space

### 1.2 Generate API Token

1. Log in as the service account
2. Go to **Account Settings** → **Security** → **API Tokens**
3. Click **Create API Token**
4. Label it "AI Assistant Integration"
5. **Save the token securely** - you'll need it for configuration

### 1.3 Identify Your CS Space

1. Navigate to your Customer Support space in Confluence
2. Note the **Space Key** (usually visible in the URL or space settings)
3. Common space keys: `CS`, `SUPPORT`, `HELP`, `DOCS`

## 🔧 Step 2: Environment Configuration

### 2.1 Update Environment Variables

Copy `.env.example` to `.env` and update these values:

```bash
# Confluence MCP Integration Configuration
REACT_APP_CONFLUENCE_BASE_URL=https://yourcompany.atlassian.net
REACT_APP_CONFLUENCE_USERNAME=ai-assistant@yourcompany.com
REACT_APP_CONFLUENCE_API_TOKEN=your_confluence_api_token_here
REACT_APP_CONFLUENCE_CS_SPACE_KEY=CS

# AI Integration (Optional - uses mock responses if not provided)
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2.2 Confluence URL Format

Ensure your Confluence base URL follows this format:
- ✅ `https://yourcompany.atlassian.net`
- ✅ `https://confluence.yourcompany.com`
- ❌ `https://yourcompany.atlassian.net/wiki` (don't include `/wiki`)

## 📚 Step 3: SOP Preparation

### 3.1 SOP Document Structure

For best results, organize your SOPs with clear structure:

```markdown
# Return Policy SOP

## Background
Brief description of when to use this SOP

## Prerequisites
- Customer account verification
- Order details available

## Process Steps

1. **Verify Customer Identity**
   - Check account details
   - Confirm purchase information

2. **Check Return Eligibility**
   - Review return timeframe (30 days)
   - Assess item condition

3. **Process Return**
   - Generate RMA number
   - Send return instructions

## Escalation
Contact: support-manager@company.com
```

### 3.2 SOP Identification

The system identifies SOPs using:
- **Title keywords**: "SOP", "Procedure", "Policy", "Process", "Guideline"
- **Labels**: Tag documents with "sop", "procedure", "customer-service"
- **Content keywords**: "customer", "support", "service", "help"

### 3.3 Recommended Categories

Organize SOPs into these categories for optimal AI performance:
- `returns` - Refunds, exchanges, returns
- `billing` - Payment issues, invoicing, subscriptions
- `shipping` - Delivery, tracking, logistics
- `technical` - Technical support, troubleshooting
- `account` - Account management, login issues
- `escalation` - Complex cases, manager involvement

## 🚀 Step 4: Testing the Integration

### 4.1 Initial Setup Test

1. Start the application: `npm run dev`
2. Navigate to **AI Assistant** page
3. Check the **Confluence Status** indicator in the header
4. Look for "Confluence Connected" with a green checkmark

### 4.2 SOP Discovery Test

1. Click the **Sync** button next to Confluence status
2. Watch for "SOPs synchronized successfully" message
3. Check the **SOPs Available** stat card for total count
4. Review the **Available SOP Categories** section

### 4.3 AI Query Test

1. Fill out the AI Assistant form:
   - **Ticket ID**: `TEST-001`
   - **Customer Voice**: "I want to return my damaged item"
   - **Agent Context**: "Customer received item yesterday, appears damaged"
   - **Priority**: Medium

2. Click **Get AI Assistance**
3. Verify the response shows:
   - Step-by-step process based on your SOPs
   - Referenced SOP sources with Confluence URLs
   - High confidence score (>80%)

## 🔍 Step 5: Monitoring & Maintenance

### 5.1 SOP Quality Monitoring

The system automatically tracks:
- **SOP Freshness**: Fresh (<30 days), Stale (30-90 days), Outdated (>90 days)
- **Relevance Scores**: How well SOPs match customer queries
- **Usage Analytics**: Most frequently referenced procedures

### 5.2 Regular Maintenance

**Weekly Tasks:**
- Review SOP categories overview
- Check for outdated procedures (>6 months)
- Update SOPs based on AI feedback

**Monthly Tasks:**
- Export SOP analytics for review
- Update service account permissions if needed
- Review and update categories

## 🔧 Step 6: Advanced Configuration

### 6.1 Custom Categories

To add custom SOP categories, update the categorization logic in:
`src/services/confluence/ConfluenceService.ts`

```typescript
const categories = {
  'your-category': ['keyword1', 'keyword2', 'keyword3'],
  // ... existing categories
}
```

### 6.2 Webhook Setup (Optional)

For real-time SOP updates:

1. In Confluence Admin → **Webhooks**
2. Create webhook pointing to: `https://your-app.com/webhooks/confluence`
3. Select events: `page_created`, `page_updated`, `page_removed`
4. Filter by your CS space

### 6.3 Performance Tuning

For large SOP repositories (>100 documents):
- Increase sync batch size in `SOPDiscoveryService.ts`
- Consider implementing SOP caching
- Monitor API rate limits

## 🆘 Troubleshooting

### Common Issues

**"Confluence Disconnected" Status**
- ✅ Check API credentials in `.env`
- ✅ Verify service account has space access
- ✅ Confirm space key is correct
- ✅ Test API token in Confluence REST API

**No SOPs Found**
- ✅ Verify SOPs contain identification keywords
- ✅ Check space permissions
- ✅ Review SOP document structure
- ✅ Add appropriate labels to documents

**Low AI Confidence Scores**
- ✅ Improve SOP structure with clear headings
- ✅ Add more specific keywords
- ✅ Break down complex procedures into steps
- ✅ Update outdated SOPs

**Sync Errors**
- ✅ Check Confluence API rate limits
- ✅ Verify network connectivity
- ✅ Review browser console for errors
- ✅ Check service account permissions

### Debug Mode

Enable debug logging by adding to `.env`:
```bash
REACT_APP_DEBUG_CONFLUENCE=true
```

This will show detailed logs in the browser console.

## 📞 Support

For technical support with the Confluence MCP integration:

1. **Check the console logs** for detailed error messages
2. **Review the setup steps** to ensure proper configuration
3. **Test with a simple SOP** to isolate issues
4. **Verify API credentials** using Confluence's REST API documentation

## 🎉 Success Metrics

You'll know the integration is working when:

✅ **Connection Status**: Green "Confluence Connected" indicator
✅ **SOP Count**: Shows actual number of discovered SOPs
✅ **AI Responses**: Reference specific SOPs with Confluence URLs
✅ **High Confidence**: AI responses show >80% confidence scores
✅ **Real-time Updates**: Changes in Confluence reflect in AI responses
✅ **Source Attribution**: Every recommendation links to specific procedures

---

**🚀 Your AI Assistant is now powered by live Confluence SOPs!**

The AI will provide responses based on your actual company procedures, automatically stay up-to-date with changes, and provide agents with direct links to the source documentation for every recommendation.