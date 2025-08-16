# Confluence Integration for GenAI CRM

This document describes the Confluence integration that allows the GenAI CRM system to access and reference Standard Operating Procedures (SOPs) and company documentation stored in Confluence.

## Overview

The Confluence integration provides:
- **Automatic SOP Retrieval**: AI queries automatically search for relevant SOPs
- **Contextual AI Responses**: AI includes SOP references in customer service responses
- **SOP Browser UI**: Interactive interface for browsing and searching company documentation
- **Real-time Suggestions**: Dynamic SOP suggestions based on customer interactions

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Confluence Configuration
CONFLUENCE_BASE_URL=https://your-company.atlassian.net
CONFLUENCE_API_TOKEN=your_confluence_api_token
CONFLUENCE_USERNAME=your_confluence_username
```

### Getting Confluence API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "GenAI CRM Integration")
4. Copy the generated token to `CONFLUENCE_API_TOKEN`

### Confluence Space Setup

For optimal SOP discovery, organize your Confluence content:

1. **Label SOPs**: Add labels like `sop`, `standard-operating-procedure`, `procedure`, `process`
2. **Use Clear Titles**: Include keywords like "SOP", "Procedure", "Process", "Guideline"
3. **Organize by Space**: Group related procedures in dedicated spaces
4. **Keep Content Updated**: Regular updates improve AI relevance

## API Endpoints

### Base URL: `/api/confluence`

#### GET `/spaces`
Returns all Confluence spaces accessible to the API user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123456",
      "key": "SUPPORT",
      "name": "Customer Support",
      "description": "Customer support procedures and guidelines",
      "type": "global"
    }
  ]
}
```

#### GET `/search?query=<search_term>&spaceKey=<space>&limit=<number>`
Search pages in Confluence.

**Parameters:**
- `query` (required): Search term
- `spaceKey` (optional): Limit search to specific space
- `limit` (optional): Number of results (default: 25)

#### GET `/sops/search?query=<search_term>&limit=<number>`
Search specifically for SOPs using enhanced filtering.

#### GET `/pages/:pageId`
Get a specific page by ID.

#### GET `/spaces/:spaceKey/pages`
Get all pages in a specific space.

#### GET `/recent?spaceKey=<space>&days=<number>&limit=<number>`
Get recently updated pages.

#### POST `/sops/suggest`
Get SOP suggestions for a customer query.

**Request Body:**
```json
{
  "query": "customer wants to return product",
  "customerId": "customer-123",
  "interactionType": "email"
}
```

#### GET `/health`
Test Confluence connection and get current user info.

## Frontend Integration

### SOP Browser Component

```tsx
import SOPBrowser from '@/components/sop/SOPBrowser'

<SOPBrowser 
  onSelectSOP={(sop) => handleSOPSelection(sop)}
  compact={true}
  searchQuery="refund policy"
/>
```

### API Service Methods

```typescript
// Search SOPs
const sops = await api.searchSOPs('refund policy', 5)

// Get SOP suggestions
const suggestions = await api.getSOPSuggestions(
  'customer wants refund',
  'customer-123',
  'email'
)

// Test connection
const health = await api.testConfluenceConnection()
```

## AI Integration

### Enhanced Context

The AI service automatically:
1. Searches for relevant SOPs based on user queries
2. Includes SOP content in AI prompts
3. References SOPs in responses with URLs
4. Provides confidence scores for SOP relevance

### Prompt Enhancement

AI prompts now include:
```
Relevant Company SOPs and Procedures:

1. Customer Refund Policy
URL: https://company.atlassian.net/wiki/spaces/SUPPORT/pages/123456
Content: When a customer requests a refund, first verify the purchase date...

Please reference these SOPs when relevant and provide the URL for further reading.
```

### Response Format

AI responses may include SOP references:
```
Based on our Customer Refund Policy (https://company.atlassian.net/wiki/spaces/SUPPORT/pages/123456), 
you can process this refund since it's within the 30-day window...
```

## Features

### Automatic SOP Discovery

The system automatically searches for SOPs when:
- AI processes customer queries
- Keywords match common support scenarios
- Customer interactions indicate need for procedures

### Smart Filtering

SOPs are filtered and ranked by:
- **Relevance Score**: Based on query matching
- **Content Quality**: Well-structured, complete procedures
- **Recency**: Recently updated content gets priority
- **Label Matching**: Proper SOP labeling in Confluence

### Real-time Suggestions

The UI provides:
- **Live Search**: As-you-type SOP search
- **Contextual Suggestions**: SOPs relevant to current conversation
- **Quick Preview**: SOP content preview without leaving chat
- **Direct Links**: One-click access to full Confluence pages

## Best Practices

### Content Organization

1. **Consistent Labeling**: Use standard labels across all SOPs
2. **Clear Hierarchy**: Organize procedures by department/topic
3. **Regular Updates**: Keep procedures current and accurate
4. **Cross-References**: Link related procedures together

### AI Optimization

1. **Keyword Rich**: Include common customer service terms
2. **Step-by-Step**: Structure procedures as clear steps
3. **Examples**: Include real-world scenarios and examples
4. **Troubleshooting**: Add common issues and solutions

### Security Considerations

1. **Access Control**: Ensure API user has appropriate permissions
2. **Sensitive Content**: Keep confidential procedures in restricted spaces
3. **Token Security**: Rotate API tokens regularly
4. **Audit Logging**: Monitor API usage and access patterns

## Troubleshooting

### Connection Issues

1. **Check API Token**: Verify token is valid and not expired
2. **Check Permissions**: Ensure user has read access to spaces
3. **Check Base URL**: Verify Confluence instance URL is correct
4. **Test Endpoint**: Use `/api/confluence/health` to test connection

### Search Issues

1. **Content Indexing**: Confluence may take time to index new content
2. **Permissions**: User must have read access to find content
3. **Label Matching**: Ensure SOPs are properly labeled
4. **Content Quality**: Well-structured content ranks higher

### AI Integration Issues

1. **Context Size**: Very long SOPs may be truncated in AI context
2. **Relevance**: Review SOP relevance scoring if results are poor
3. **Language**: Ensure SOPs use clear, customer-service language
4. **Updates**: Keep SOPs current for best AI performance

## Analytics

The system tracks:
- **SOP Usage**: Which SOPs are accessed most frequently
- **Search Patterns**: Common search terms and scenarios
- **AI References**: How often AI references specific SOPs
- **User Engagement**: Which SOPs users find most helpful

## Deployment

### Production Considerations

1. **Rate Limiting**: Confluence APIs have rate limits
2. **Caching**: Implement caching for frequently accessed content
3. **Monitoring**: Monitor API usage and performance
4. **Fallbacks**: Graceful degradation when Confluence is unavailable

### Performance Optimization

1. **Parallel Requests**: Use concurrent API calls where possible
2. **Content Caching**: Cache frequently accessed SOP content
3. **Smart Indexing**: Pre-index common customer scenarios
4. **Async Processing**: Handle SOP retrieval asynchronously

## Support

For issues with Confluence integration:
1. Check the `/api/confluence/health` endpoint
2. Review server logs for API errors
3. Verify Confluence permissions and configuration
4. Test with simple queries before complex scenarios