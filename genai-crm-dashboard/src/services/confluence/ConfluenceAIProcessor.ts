import { ConfluenceAIContextBuilder } from './ConfluenceAIContextBuilder';
import {
  CustomerQuery,
  EnhancedAIContext,
  EnhancedAIResponse
} from './types';

export class ConfluenceAIProcessor {
  constructor(
    private contextBuilder: ConfluenceAIContextBuilder,
    _anthropicApiKey?: string // For future use
  ) {
    // API key configuration for future Anthropic API integration
  }

  async processQueryWithConfluenceSOPs(query: CustomerQuery): Promise<EnhancedAIResponse> {
    console.log(`🤖 Processing AI query with Confluence SOPs for ticket: ${query.ticketId}`);
    
    try {
      // 1. Build rich context with live Confluence data
      const context = await this.contextBuilder.buildRichContext(query);
      console.log(`📋 Context built with ${context.relevantProcedures.length} relevant procedures`);

      // 2. Validate context quality
      const validation = this.contextBuilder.validateContextQuality(context);
      if (!validation.isValid) {
        console.warn('⚠️ Context quality issues:', validation.issues);
      }

      // 3. Create enhanced prompt with actual company procedures
      const enhancedPrompt = this.buildConfluenceEnhancedPrompt(context);

      // 4. Process with AI (mock for now - replace with actual Anthropic API)
      const aiResponse = await this.processWithAI(enhancedPrompt);

      // 5. Parse and validate response
      const parsedResponse = this.parseAIResponse(aiResponse);

      // 6. Enhanced response with Confluence metadata
      const enhancedResponse: EnhancedAIResponse = {
        ...parsedResponse,
        sopSources: context.sopSources.map(source => ({
          title: source.title,
          url: source.url,
          version: source.version.toString(),
          relevanceScore: context.relevantProcedures.find(p => p.title === source.title)?.relevanceScore || 0
        })),
        lastSOPUpdate: context.sopSources.length > 0 ? context.sopSources[0].lastUpdated : undefined,
        sopFreshness: this.calculateSOPFreshness(context.relevantProcedures),
        totalSOPsConsulted: context.relevantProcedures.length
      };

      console.log(`✅ AI processing complete. Confidence: ${enhancedResponse.confidenceScore}%`);
      return enhancedResponse;
    } catch (error) {
      console.error('❌ Error processing query with Confluence SOPs:', error);
      throw error;
    }
  }

  private buildConfluenceEnhancedPrompt(context: EnhancedAIContext): string {
    return `
You are a customer service AI assistant with access to our company's live Standard Operating Procedures from Confluence. You must provide responses based ONLY on the current, official procedures provided below.

CUSTOMER ISSUE:
${context.customerIssue}

AGENT CONTEXT:
${context.agentNotes || 'No additional agent notes provided'}

TICKET DETAILS:
- Ticket ID: ${context.ticketId}
- Customer ID: ${context.customerId || 'Not provided'}
- Priority: ${context.priority || 'Normal'}

CURRENT COMPANY PROCEDURES (from Confluence CS Space):

${context.relevantProcedures.map((procedure, index) => `
=== PROCEDURE ${index + 1}: ${procedure.title} ===
Last Updated: ${procedure.lastUpdated.toISOString()}
Confluence URL: ${procedure.confluenceUrl}
Version: ${procedure.version}
Category: ${procedure.category}
Relevance Score: ${(procedure.relevanceScore * 100).toFixed(1)}%

FULL PROCEDURE:
${procedure.procedure}

KEY SECTIONS:
${procedure.sections.map(section => `
▸ ${section.title}:
${section.content.substring(0, 300)}${section.content.length > 300 ? '...' : ''}
`).join('\n')}

---
`).join('\n')}

${context.productContext ? `
PRODUCT CONTEXT:
${JSON.stringify(context.productContext, null, 2)}
` : ''}

${context.customerHistory ? `
CUSTOMER HISTORY:
${JSON.stringify(context.customerHistory, null, 2)}
` : ''}

INSTRUCTIONS:
1. Follow our CURRENT procedures from Confluence exactly - do not deviate or add generic advice
2. Reference specific SOP sections and steps in your response
3. Provide step-by-step agent actions based ONLY on our documented SOPs
4. Generate customer response using our company's established procedures and tone
5. Include direct Confluence URLs for agent reference
6. If multiple SOPs apply, prioritize by relevance score and recency
7. CRITICAL: Only use information from the provided Confluence SOPs. If the customer issue is not covered in our current procedures, classify as "new_scenario" and suggest escalation.

RESPONSE FORMAT (JSON):
{
  "processSteps": [
    {
      "step": 1,
      "action": "Specific action from SOP with exact section reference",
      "sopReference": "SOP title and specific section name",
      "confluenceUrl": "Direct link to relevant Confluence page",
      "reasoning": "Why this step based on our SOP"
    }
  ],
  "suggestedResponse": "Customer-facing response following our exact procedures and brand voice from SOPs",
  "classification": "sop_based|new_scenario|unclear",
  "confidenceScore": 95,
  "sopSources": [
    {
      "title": "SOP title used",
      "url": "Confluence URL",
      "version": "Version number",
      "relevanceScore": 85
    }
  ],
  "reasoning": "Detailed explanation of why this approach based on our specific SOPs",
  "escalationNeeded": false,
  "additionalResources": ["Links to related Confluence pages if helpful for complex cases"]
}

CRITICAL REQUIREMENTS:
- Base ALL responses on the provided SOPs - no generic customer service advice
- Reference exact SOP sections and procedures
- Maintain consistency with our documented processes
- Provide actionable steps the agent can follow immediately
- Include source attribution for every recommendation

Generate your response now:
`;
  }

  private async processWithAI(_prompt: string): Promise<string> {
    // Mock AI response for now - replace with actual Anthropic API call
    console.log('🔄 Processing with AI...');
    
    // Simulated AI response
    const mockResponse = {
      processSteps: [
        {
          step: 1,
          action: "Review customer's return request details and verify purchase information according to our Return Policy SOP",
          sopReference: "Return Policy SOP - Section 2: Verification Process",
          confluenceUrl: "https://company.atlassian.net/wiki/spaces/CS/pages/123456/Return+Policy",
          reasoning: "Our SOP requires verification before processing any return"
        },
        {
          step: 2,
          action: "Check return eligibility timeframe (30 days from purchase) as specified in Return Policy Section 3",
          sopReference: "Return Policy SOP - Section 3: Eligibility Criteria",
          confluenceUrl: "https://company.atlassian.net/wiki/spaces/CS/pages/123456/Return+Policy",
          reasoning: "SOP clearly states 30-day return window for standard items"
        }
      ],
      suggestedResponse: "Thank you for contacting us about your return request. I'd be happy to help you with this. To process your return according to our policy, I'll need to verify a few details about your purchase. Could you please provide your order number and the date of purchase? Once verified, I can guide you through our return process.",
      classification: "sop_based",
      confidenceScore: 92,
      sopSources: [
        {
          title: "Return Policy SOP",
          url: "https://company.atlassian.net/wiki/spaces/CS/pages/123456/Return+Policy",
          version: "3",
          relevanceScore: 95
        }
      ],
      reasoning: "Customer is requesting a return, which is directly covered by our Return Policy SOP. The procedure clearly outlines verification steps and eligibility criteria that must be followed.",
      escalationNeeded: false,
      additionalResources: ["https://company.atlassian.net/wiki/spaces/CS/pages/789012/Refund+Processing+Guide"]
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return JSON.stringify(mockResponse, null, 2);
  }

  private parseAIResponse(aiResponse: string): Omit<EnhancedAIResponse, 'sopSources' | 'lastSOPUpdate' | 'sopFreshness' | 'totalSOPsConsulted'> {
    try {
      const parsed = JSON.parse(aiResponse);
      
      // Validate required fields
      const required = ['processSteps', 'suggestedResponse', 'classification', 'confidenceScore'];
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Ensure confidenceScore is within valid range
      parsed.confidenceScore = Math.max(0, Math.min(100, parsed.confidenceScore));

      return parsed;
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      
      // Return fallback response
      return {
        processSteps: [
          {
            step: 1,
            action: "Review the customer's inquiry and check our procedures",
            sopReference: "General Support Guidelines",
            confluenceUrl: "",
            reasoning: "Fallback response due to parsing error"
          }
        ],
        suggestedResponse: "Thank you for contacting us. Let me review your request and get back to you with the appropriate next steps based on our procedures.",
        classification: "unclear",
        confidenceScore: 30,
        reasoning: "Unable to parse AI response properly",
        escalationNeeded: true,
        additionalResources: []
      };
    }
  }

  private calculateSOPFreshness(procedures: any[]): 'fresh' | 'stale' | 'outdated' {
    if (procedures.length === 0) return 'outdated';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const freshCount = procedures.filter(p => p.lastUpdated >= thirtyDaysAgo).length;
    const staleCount = procedures.filter(p => p.lastUpdated >= ninetyDaysAgo && p.lastUpdated < thirtyDaysAgo).length;

    const freshRatio = freshCount / procedures.length;
    const staleRatio = staleCount / procedures.length;

    if (freshRatio >= 0.7) return 'fresh';
    if (freshRatio + staleRatio >= 0.7) return 'stale';
    return 'outdated';
  }

  // Note: Anthropic API integration available when needed
  // Uncomment and use the following method for real API calls

  // Batch processing for multiple queries
  async processMultipleQueries(queries: CustomerQuery[]): Promise<EnhancedAIResponse[]> {
    console.log(`🔄 Processing ${queries.length} queries in batch...`);
    
    const results = await Promise.all(
      queries.map(async (query, index) => {
        try {
          console.log(`Processing query ${index + 1}/${queries.length}: ${query.ticketId}`);
          return await this.processQueryWithConfluenceSOPs(query);
        } catch (error) {
          console.error(`❌ Error processing query ${query.ticketId}:`, error);
          throw error;
        }
      })
    );

    console.log(`✅ Batch processing complete: ${results.length} queries processed`);
    return results;
  }

  // Quality assessment of AI responses
  assessResponseQuality(response: EnhancedAIResponse): {
    score: number;
    strengths: string[];
    improvements: string[];
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    let score = 100;

    // Check SOP usage
    if (response.sopSources.length === 0) {
      improvements.push('No SOPs referenced - response may be generic');
      score -= 30;
    } else {
      strengths.push(`References ${response.sopSources.length} relevant SOPs`);
    }

    // Check confidence score
    if (response.confidenceScore >= 80) {
      strengths.push('High confidence in response accuracy');
    } else if (response.confidenceScore < 60) {
      improvements.push('Low confidence score - may need human review');
      score -= 15;
    }

    // Check process steps
    if (response.processSteps.length === 0) {
      improvements.push('No actionable steps provided');
      score -= 20;
    } else if (response.processSteps.length >= 3) {
      strengths.push('Detailed step-by-step guidance provided');
    }

    // Check escalation appropriateness
    if (response.escalationNeeded && response.confidenceScore > 70) {
      improvements.push('Consider if escalation is necessary with high confidence');
      score -= 5;
    }

    // Check SOP freshness
    if (response.sopFreshness === 'outdated') {
      improvements.push('Based on outdated SOPs - may need review');
      score -= 10;
    } else if (response.sopFreshness === 'fresh') {
      strengths.push('Based on recently updated SOPs');
    }

    return {
      score: Math.max(0, score),
      strengths,
      improvements
    };
  }
}