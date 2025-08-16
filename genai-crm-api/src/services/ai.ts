import Anthropic from '@anthropic-ai/sdk';
import { supabase, logger } from '../server';
import { confluenceService, ConfluencePage } from './confluence';
import { AIQueryRequest, Customer, Interaction } from '../types';

export interface AIContext {
  customer?: Customer;
  previousInteractions?: Interaction[];
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  relevantSOPs?: ConfluencePage[];
  metadata?: Record<string, any>;
}

export interface AIResponse {
  response: string;
  confidence_score: number;
  processing_time_ms: number;
  suggestions?: Array<{
    type: 'direct' | 'detailed' | 'empathetic';
    text: string;
    confidence: number;
  }>;
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

export class AIService {
  private anthropic: Anthropic;
  private responseCache = new Map<string, { response: AIResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(anthropic: Anthropic) {
    this.anthropic = anthropic;
  }

  async processQuery(
    query: string,
    context: AIContext = {},
    userId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query, context);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        logger.info('AI query served from cache', { userId, query_length: query.length });
        return cached;
      }

      // Build enhanced context
      const enhancedContext = await this.buildEnhancedContext(context, query);
      
      // Generate prompt
      const prompt = this.buildPrompt(query, enhancedContext);
      
      // Call Anthropic API
      const message = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : '';

      // Analyze response
      const analysis = await this.analyzeResponse(query, responseText, enhancedContext);
      
      const response: AIResponse = {
        response: responseText,
        confidence_score: analysis.confidence,
        processing_time_ms: Date.now() - startTime,
        suggestions: await this.generateSuggestions(query, enhancedContext),
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        metadata: {
          model: 'claude-3-sonnet-20240229',
          prompt_length: prompt.length,
          has_context: Object.keys(enhancedContext).length > 0
        }
      };

      // Cache response
      this.cacheResponse(cacheKey, response);

      // Store in database
      await this.storeAIResponse(userId, query, response, context.customer?.id);

      logger.info('AI query processed successfully', {
        userId,
        processing_time: response.processing_time_ms,
        confidence: response.confidence_score,
        intent: response.intent
      });

      return response;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logger.error('AI query processing failed', {
        userId,
        error: error.message,
        processing_time: processingTime
      });

      // Return fallback response
      return this.getFallbackResponse(query, processingTime);
    }
  }

  async generateSuggestions(
    query: string,
    context: AIContext
  ): Promise<Array<{ type: 'direct' | 'detailed' | 'empathetic'; text: string; confidence: number }>> {
    try {
      const prompt = this.buildSuggestionsPrompt(query, context);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : '';

      // Parse suggestions from response
      return this.parseSuggestions(responseText);

    } catch (error) {
      logger.warn('Failed to generate suggestions', { error });
      return this.getDefaultSuggestions(query);
    }
  }

  async analyzeIntent(query: string): Promise<string> {
    try {
      const prompt = `Analyze the following customer query and identify the primary intent. 
      
Customer Query: "${query}"

Classify the intent as one of:
- question (asking for information)
- complaint (expressing dissatisfaction)
- request (asking for action)
- compliment (expressing satisfaction)
- technical_support (technical issues)
- billing (payment/pricing questions)
- general (other inquiries)

Respond with just the intent category.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Faster model for classification
        max_tokens: 50,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      });

      const intent = message.content[0].type === 'text' 
        ? message.content[0].text.trim().toLowerCase()
        : 'general';

      return ['question', 'complaint', 'request', 'compliment', 'technical_support', 'billing', 'general']
        .includes(intent) ? intent : 'general';

    } catch (error) {
      logger.warn('Intent analysis failed', { error });
      return 'general';
    }
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const prompt = `Analyze the sentiment of the following text:

"${text}"

Respond with only: positive, neutral, or negative`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 20,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      });

      const sentiment = message.content[0].type === 'text' 
        ? message.content[0].text.trim().toLowerCase()
        : 'neutral';

      return ['positive', 'neutral', 'negative'].includes(sentiment) 
        ? sentiment as 'positive' | 'neutral' | 'negative'
        : 'neutral';

    } catch (error) {
      logger.warn('Sentiment analysis failed', { error });
      return 'neutral';
    }
  }

  private async buildEnhancedContext(context: AIContext, query?: string): Promise<AIContext> {
    const enhanced = { ...context };

    // Fetch customer history if customer ID provided
    if (context.customer?.id) {
      try {
        const { data: interactions } = await supabase
          .from('interactions')
          .select('*')
          .eq('customer_id', context.customer.id)
          .order('created_at', { ascending: false })
          .limit(5);

        enhanced.previousInteractions = interactions || [];
      } catch (error) {
        logger.warn('Failed to fetch customer interactions', { error });
      }
    }

    // Fetch relevant SOPs from Confluence if query provided
    if (query) {
      try {
        const relevantSOPs = await confluenceService.searchSOPs(query, 3);
        enhanced.relevantSOPs = relevantSOPs;
        logger.info('Retrieved SOPs for context', { count: relevantSOPs.length, query_length: query.length });
      } catch (error) {
        logger.warn('Failed to fetch relevant SOPs', { error });
        enhanced.relevantSOPs = [];
      }
    }

    return enhanced;
  }

  private buildPrompt(query: string, context: AIContext): string {
    let prompt = `You are an expert customer service AI assistant. Your goal is to provide helpful, professional, and empathetic responses to customer inquiries.

Customer Query: "${query}"`;

    if (context.customer) {
      prompt += `\n\nCustomer Information:
- Name: ${context.customer.name}
- Email: ${context.customer.email}
- Company: ${context.customer.company || 'N/A'}`;
    }

    if (context.previousInteractions && context.previousInteractions.length > 0) {
      prompt += `\n\nRecent Interaction History:`;
      context.previousInteractions.slice(0, 3).forEach((interaction, index) => {
        prompt += `\n${index + 1}. ${interaction.type}: ${interaction.content.slice(0, 100)}${interaction.content.length > 100 ? '...' : ''}`;
      });
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `\n\nConversation History:`;
      context.conversationHistory.slice(-3).forEach((msg) => {
        prompt += `\n${msg.role}: ${msg.content}`;
      });
    }

    if (context.relevantSOPs && context.relevantSOPs.length > 0) {
      prompt += `\n\nRelevant Company SOPs and Procedures:`;
      context.relevantSOPs.slice(0, 2).forEach((sop, index) => {
        prompt += `\n\n${index + 1}. ${sop.title}`;
        prompt += `\nURL: ${sop.url}`;
        // Include first 300 characters of content for context
        const content = sop.content.slice(0, 300);
        prompt += `\nContent: ${content}${sop.content.length > 300 ? '...' : ''}`;
      });
      prompt += `\n\nPlease reference these SOPs when relevant and provide the URL for further reading.`;
    }

    prompt += `\n\nProvide a helpful, professional response that:
1. Addresses the customer's specific query
2. Takes into account their history and context
3. References relevant SOPs and procedures when applicable
4. Maintains a friendly and empathetic tone
5. Offers clear next steps when appropriate
6. Includes SOP URLs when referencing procedures

Response:`;

    return prompt;
  }

  private buildSuggestionsPrompt(query: string, context: AIContext): string {
    return `Generate 3 different response suggestions for this customer service scenario:

Customer Query: "${query}"

${context.customer ? `Customer: ${context.customer.name} (${context.customer.company})` : ''}

Provide 3 response options:
1. DIRECT: A brief, to-the-point response
2. DETAILED: A comprehensive, thorough response
3. EMPATHETIC: A warm, relationship-focused response

Format as JSON array:
[
  {"type": "direct", "text": "...", "confidence": 0.85},
  {"type": "detailed", "text": "...", "confidence": 0.80},
  {"type": "empathetic", "text": "...", "confidence": 0.75}
]`;
  }

  private async analyzeResponse(
    query: string, 
    response: string, 
    context: AIContext
  ): Promise<{ confidence: number; intent: string; sentiment: string }> {
    // Calculate confidence based on response quality
    let confidence = 0.7; // Base confidence
    
    // Increase confidence if response is detailed
    if (response.length > 100) confidence += 0.1;
    if (response.includes('?')) confidence += 0.05; // Asks clarifying questions
    if (response.toLowerCase().includes('sorry') || response.toLowerCase().includes('apologize')) {
      confidence += 0.05; // Shows empathy
    }
    
    // Decrease confidence for very short responses
    if (response.length < 50) confidence -= 0.15;
    
    confidence = Math.min(0.95, Math.max(0.3, confidence));

    // Analyze intent and sentiment in parallel
    const [intent, sentiment] = await Promise.all([
      this.analyzeIntent(query),
      this.analyzeSentiment(query)
    ]);

    return { confidence, intent, sentiment };
  }

  private parseSuggestions(responseText: string): Array<{ type: 'direct' | 'detailed' | 'empathetic'; text: string; confidence: number }> {
    try {
      const suggestions = JSON.parse(responseText);
      if (Array.isArray(suggestions)) {
        return suggestions.map(s => ({
          type: s.type || 'direct',
          text: s.text || '',
          confidence: s.confidence || 0.7
        }));
      }
    } catch (error) {
      logger.warn('Failed to parse suggestions JSON', { error });
    }

    // Fallback to default suggestions
    return this.getDefaultSuggestions(responseText);
  }

  private getDefaultSuggestions(query: string): Array<{ type: 'direct' | 'detailed' | 'empathetic'; text: string; confidence: number }> {
    return [
      {
        type: 'direct',
        text: 'Thank you for your inquiry. Let me help you with that right away.',
        confidence: 0.7
      },
      {
        type: 'detailed',
        text: 'I understand your concern and I want to make sure we address this properly. Let me walk you through the solution step by step.',
        confidence: 0.75
      },
      {
        type: 'empathetic',
        text: 'I really appreciate you bringing this to our attention. Your experience is important to us, and I want to ensure we resolve this to your satisfaction.',
        confidence: 0.8
      }
    ];
  }

  private async storeAIResponse(
    userId: string,
    query: string,
    response: AIResponse,
    customerId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('ai_responses')
        .insert({
          user_id: userId,
          customer_id: customerId,
          query,
          response: response.response,
          confidence_score: response.confidence_score,
          processing_time_ms: response.processing_time_ms,
          metadata: {
            intent: response.intent,
            sentiment: response.sentiment,
            suggestions_count: response.suggestions?.length || 0,
            ...response.metadata
          }
        });
    } catch (error) {
      logger.error('Failed to store AI response', { error });
    }
  }

  private generateCacheKey(query: string, context: AIContext): string {
    const contextKey = JSON.stringify({
      customerId: context.customer?.id,
      hasHistory: !!context.previousInteractions?.length
    });
    return `${query.toLowerCase().trim()}_${contextKey}`;
  }

  private getCachedResponse(key: string): AIResponse | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response;
    }
    if (cached) {
      this.responseCache.delete(key);
    }
    return null;
  }

  private cacheResponse(key: string, response: AIResponse): void {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  private getFallbackResponse(query: string, processingTime: number): AIResponse {
    return {
      response: "I'm sorry, I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to contact our support team directly for immediate assistance.",
      confidence_score: 0.3,
      processing_time_ms: processingTime,
      intent: 'general',
      sentiment: 'neutral',
      metadata: { fallback: true }
    };
  }
}

export default AIService;