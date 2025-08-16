export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
  examples?: Array<{
    input: Record<string, any>;
    expectedOutput: string;
  }>;
}

export class PromptTemplateManager {
  private templates = new Map<string, PromptTemplate>();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Customer Service Response Template
    this.addTemplate({
      name: 'customer_service_response',
      description: 'Generate professional customer service responses',
      template: `You are an expert customer service representative. Your goal is to provide helpful, professional, and empathetic responses.

Customer Information:
{{#customer}}
- Name: {{name}}
- Email: {{email}}
- Company: {{company}}
- Customer Tier: {{metadata.tier}}
{{/customer}}

{{#previousInteractions}}
Recent Interaction History:
{{#each this}}
{{@index}}. {{type}}: {{content}}
   Sentiment: {{sentiment}} | Date: {{created_at}}
{{/each}}
{{/previousInteractions}}

Current Query: "{{query}}"

{{#context}}
Additional Context:
{{#each this}}
- {{@key}}: {{this}}
{{/each}}
{{/context}}

Instructions:
1. Address the customer by name when appropriate
2. Reference relevant history if available
3. Provide clear, actionable solutions
4. Maintain a {{tone}} tone
5. Offer follow-up assistance

Response:`,
      variables: ['customer', 'previousInteractions', 'query', 'context', 'tone']
    });

    // Intent Classification Template
    this.addTemplate({
      name: 'intent_classification',
      description: 'Classify customer query intent',
      template: `Analyze the following customer query and classify the primary intent.

Customer Query: "{{query}}"

{{#customerHistory}}
Customer Background:
- Previous interactions: {{interactionCount}}
- Dominant sentiment: {{dominantSentiment}}
- Account status: {{accountStatus}}
{{/customerHistory}}

Available Intent Categories:
1. question - Seeking information or clarification
2. complaint - Expressing dissatisfaction or problems
3. request - Asking for specific action or service
4. compliment - Expressing satisfaction or praise
5. technical_support - Reporting technical issues
6. billing - Payment, pricing, or account questions
7. feature_request - Suggesting new features or improvements
8. cancellation - Intent to cancel or downgrade
9. escalation - Requesting manager or higher authority
10. general - Other inquiries not fitting above categories

Consider:
- Explicit keywords and phrases
- Emotional tone and urgency
- Customer history and context
- Implied needs behind the request

Classification: `,
      variables: ['query', 'customerHistory']
    });

    // Sentiment Analysis Template
    this.addTemplate({
      name: 'sentiment_analysis',
      description: 'Analyze sentiment of customer communications',
      template: `Analyze the sentiment of the following customer communication.

Text to analyze: "{{text}}"

{{#context}}
Context:
- Communication type: {{type}}
- Customer tier: {{customerTier}}
- Previous sentiment: {{previousSentiment}}
- Interaction number: {{interactionNumber}}
{{/context}}

Consider:
1. Explicit emotional words and phrases
2. Tone and language style
3. Urgency indicators
4. Context and history
5. Cultural communication patterns

Sentiment Categories:
- POSITIVE: Satisfied, happy, appreciative, excited
- NEUTRAL: Factual, informational, routine inquiries
- NEGATIVE: Frustrated, angry, disappointed, confused

Provide:
1. Primary sentiment: [positive/neutral/negative]
2. Confidence score: [0.0-1.0]
3. Key indicators: [specific words/phrases]
4. Emotional intensity: [low/medium/high]

Analysis:`,
      variables: ['text', 'context']
    });

    // Response Suggestions Template
    this.addTemplate({
      name: 'response_suggestions',
      description: 'Generate multiple response options',
      template: `Generate three different response options for this customer service scenario.

Customer Query: "{{query}}"
Intent: {{intent}}
Sentiment: {{sentiment}}

{{#customer}}
Customer Profile:
- Name: {{name}}
- Company: {{company}}
- Tier: {{metadata.tier}}
- Communication Style: {{metadata.communication_style}}
{{/customer}}

{{#context}}
Situation Context:
{{#each this}}
- {{@key}}: {{this}}
{{/each}}
{{/context}}

Generate three response approaches:

1. DIRECT APPROACH
   - Brief and to-the-point
   - Immediate solution focus
   - Professional but efficient
   - Target length: 50-100 words

2. DETAILED APPROACH
   - Comprehensive explanation
   - Step-by-step guidance
   - Educational elements
   - Target length: 150-250 words

3. EMPATHETIC APPROACH
   - Relationship-focused
   - Emotional validation
   - Personal touch
   - Target length: 100-150 words

Format as JSON:
{
  "suggestions": [
    {
      "type": "direct",
      "text": "...",
      "confidence": 0.85,
      "reasoning": "..."
    },
    {
      "type": "detailed", 
      "text": "...",
      "confidence": 0.80,
      "reasoning": "..."
    },
    {
      "type": "empathetic",
      "text": "...",
      "confidence": 0.82,
      "reasoning": "..."
    }
  ]
}`,
      variables: ['query', 'intent', 'sentiment', 'customer', 'context']
    });

    // Quality Assessment Template
    this.addTemplate({
      name: 'response_quality_assessment',
      description: 'Assess quality of generated responses',
      template: `Evaluate the quality of this customer service response.

Original Query: "{{originalQuery}}"
Customer Context: {{customerContext}}
Generated Response: "{{response}}"

Assessment Criteria:

1. RELEVANCE (0-10)
   - Directly addresses the query
   - Stays on topic
   - Addresses customer's actual need

2. CLARITY (0-10)
   - Easy to understand
   - Well-structured
   - No ambiguity

3. EMPATHY (0-10)
   - Shows understanding
   - Appropriate emotional tone
   - Validates customer feelings

4. COMPLETENESS (0-10)
   - Answers all aspects of query
   - Provides sufficient detail
   - Offers next steps

5. PROFESSIONALISM (0-10)
   - Appropriate tone
   - Error-free communication
   - Brand voice consistency

Provide assessment as JSON:
{
  "overall_score": 8.5,
  "relevance": 9,
  "clarity": 8,
  "empathy": 8,
  "completeness": 9,
  "professionalism": 8,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "confidence": 0.87
}`,
      variables: ['originalQuery', 'customerContext', 'response']
    });

    // Escalation Detection Template
    this.addTemplate({
      name: 'escalation_detection',
      description: 'Detect when queries need escalation',
      template: `Analyze this customer interaction to determine if escalation is needed.

Customer Query: "{{query}}"
Customer Sentiment: {{sentiment}}
Interaction History: {{interactionCount}} previous interactions

{{#previousInteractions}}
Recent Issues:
{{#each this}}
- {{type}}: {{content}} ({{sentiment}})
{{/each}}
{{/previousInteractions}}

Escalation Indicators:
1. Explicit escalation requests ("speak to manager", "this is unacceptable")
2. High frustration/anger levels
3. Repeated unresolved issues
4. Complex technical problems
5. Billing disputes
6. Legal threats or compliance issues
7. VIP/enterprise customer concerns
8. Multiple failed resolution attempts

Risk Factors:
- Customer tier: {{customerTier}}
- Issue complexity: {{issueComplexity}}
- Response time: {{responseTime}}
- Previous escalations: {{previousEscalations}}

Decision Matrix:
- IMMEDIATE: Critical issues requiring instant escalation
- RECOMMENDED: Issues that would benefit from supervisor involvement  
- MONITOR: Issues to watch but can be handled by agent
- STANDARD: Normal customer service interaction

Provide analysis as JSON:
{
  "escalation_level": "recommended",
  "confidence": 0.85,
  "reasoning": "Customer has expressed frustration multiple times...",
  "suggested_action": "Transfer to senior agent",
  "urgency": "medium",
  "risk_factors": ["repeated_issues", "negative_sentiment"]
}`,
      variables: ['query', 'sentiment', 'interactionCount', 'previousInteractions', 'customerTier', 'issueComplexity', 'responseTime', 'previousEscalations']
    });
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
  }

  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  renderTemplate(name: string, variables: Record<string, any>): string {
    const template = this.getTemplate(name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }

    return this.interpolateTemplate(template.template, variables);
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    // Simple template interpolation
    let result = template;

    // Handle {{variable}} replacements
    result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName]?.toString() || '';
    });

    // Handle {{#if variable}} blocks
    result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    // Handle {{#each variable}} blocks
    result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, varName, content) => {
      const array = variables[varName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = content;
        itemContent = itemContent.replace(/\{\{@index\}\}/g, (index + 1).toString());
        itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (match, prop) => {
          return item[prop]?.toString() || '';
        });
        return itemContent;
      }).join('');
    });

    // Handle nested object properties
    result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, objName, propName) => {
      return variables[objName]?.[propName]?.toString() || '';
    });

    return result;
  }

  listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  validateTemplate(name: string, variables: Record<string, any>): { valid: boolean; missingVariables: string[] } {
    const template = this.getTemplate(name);
    if (!template) {
      return { valid: false, missingVariables: [] };
    }

    const providedVars = new Set(Object.keys(variables));
    const requiredVars = new Set(template.variables);
    const missingVariables = Array.from(requiredVars).filter(v => !providedVars.has(v));

    return {
      valid: missingVariables.length === 0,
      missingVariables
    };
  }
}

export default PromptTemplateManager;