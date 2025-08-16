import { supabase, logger } from '../server';

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  customer_id: string;
  agent_id: string;
  conversation_id: string;
  turns: ConversationTurn[];
  summary?: string;
  status: 'active' | 'resolved' | 'escalated' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  key_topics: string[];
  customer_intent: string;
  resolution_status: 'resolved' | 'pending' | 'escalated';
  sentiment_progression: Array<{
    turn: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  next_steps: string[];
}

export class ConversationMemoryService {
  private maxTurnsPerConversation = 50;
  private summaryInterval = 10; // Summarize every 10 turns
  private memoryCache = new Map<string, ConversationContext>();

  async startConversation(
    customerId: string,
    agentId: string,
    initialMessage?: string
  ): Promise<string> {
    try {
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const context: ConversationContext = {
        customer_id: customerId,
        agent_id: agentId,
        conversation_id: conversationId,
        turns: [],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (initialMessage) {
        context.turns.push({
          id: `turn_${Date.now()}`,
          role: 'user',
          content: initialMessage,
          timestamp: new Date().toISOString(),
          metadata: { type: 'initial_message' }
        });
      }

      // Store in database
      await this.storeConversationContext(context);
      
      // Cache in memory
      this.memoryCache.set(conversationId, context);

      logger.info('Conversation started', {
        conversation_id: conversationId,
        customer_id: customerId,
        agent_id: agentId
      });

      return conversationId;

    } catch (error) {
      logger.error('Failed to start conversation', { error });
      throw error;
    }
  }

  async addConversationTurn(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      let context = await this.getConversationContext(conversationId);
      if (!context) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      const turn: ConversationTurn = {
        id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        role,
        content,
        timestamp: new Date().toISOString(),
        metadata
      };

      context.turns.push(turn);
      context.updated_at = new Date().toISOString();

      // Limit conversation length
      if (context.turns.length > this.maxTurnsPerConversation) {
        // Archive older turns and keep recent ones
        await this.archiveOldTurns(context);
      }

      // Generate summary periodically
      if (context.turns.length % this.summaryInterval === 0) {
        context.summary = await this.generateConversationSummary(context);
      }

      // Update storage
      await this.storeConversationContext(context);
      this.memoryCache.set(conversationId, context);

      logger.debug('Conversation turn added', {
        conversation_id: conversationId,
        role,
        turn_count: context.turns.length
      });

    } catch (error) {
      logger.error('Failed to add conversation turn', { error, conversationId });
      throw error;
    }
  }

  async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
    try {
      // Check memory cache first
      const cached = this.memoryCache.get(conversationId);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('conversation_contexts')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error || !data) {
        return null;
      }

      const context: ConversationContext = {
        customer_id: data.customer_id,
        agent_id: data.agent_id,
        conversation_id: data.conversation_id,
        turns: data.turns || [],
        summary: data.summary,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Cache for future use
      this.memoryCache.set(conversationId, context);

      return context;

    } catch (error) {
      logger.error('Failed to get conversation context', { error, conversationId });
      return null;
    }
  }

  async getRecentContext(
    conversationId: string,
    maxTurns: number = 10
  ): Promise<ConversationTurn[]> {
    try {
      const context = await this.getConversationContext(conversationId);
      if (!context) {
        return [];
      }

      return context.turns.slice(-maxTurns);

    } catch (error) {
      logger.error('Failed to get recent context', { error, conversationId });
      return [];
    }
  }

  async searchConversationHistory(
    customerId: string,
    query: string,
    limit: number = 5
  ): Promise<Array<{
    conversation_id: string;
    relevant_turns: ConversationTurn[];
    context_summary: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('conversation_contexts')
        .select('*')
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false })
        .limit(20); // Get recent conversations

      if (error || !data) {
        return [];
      }

      const results = [];
      const queryLower = query.toLowerCase();

      for (const conv of data) {
        const turns = conv.turns || [];
        const relevantTurns = turns.filter((turn: ConversationTurn) =>
          turn.content.toLowerCase().includes(queryLower)
        );

        if (relevantTurns.length > 0) {
          results.push({
            conversation_id: conv.conversation_id,
            relevant_turns: relevantTurns.slice(0, 3), // Limit relevant turns
            context_summary: conv.summary || 'No summary available'
          });
        }
      }

      return results.slice(0, limit);

    } catch (error) {
      logger.error('Failed to search conversation history', { error });
      return [];
    }
  }

  async generateConversationSummary(context: ConversationContext): Promise<string> {
    try {
      if (context.turns.length === 0) {
        return 'Empty conversation';
      }

      // Simple extractive summary
      const userMessages = context.turns
        .filter(turn => turn.role === 'user')
        .map(turn => turn.content)
        .join(' ');

      const assistantMessages = context.turns
        .filter(turn => turn.role === 'assistant')
        .map(turn => turn.content)
        .join(' ');

      // Extract key information
      const summary = `Customer inquiry: ${userMessages.slice(0, 200)}... 
                      Response approach: ${assistantMessages.slice(0, 200)}...
                      Total turns: ${context.turns.length}
                      Status: ${context.status}`;

      return summary;

    } catch (error) {
      logger.error('Failed to generate conversation summary', { error });
      return 'Summary generation failed';
    }
  }

  async closeConversation(
    conversationId: string,
    status: 'resolved' | 'escalated' | 'closed' = 'resolved',
    finalSummary?: string
  ): Promise<void> {
    try {
      const context = await this.getConversationContext(conversationId);
      if (!context) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      context.status = status;
      context.updated_at = new Date().toISOString();

      if (finalSummary) {
        context.summary = finalSummary;
      } else if (!context.summary) {
        context.summary = await this.generateConversationSummary(context);
      }

      await this.storeConversationContext(context);
      
      // Remove from active memory cache
      this.memoryCache.delete(conversationId);

      logger.info('Conversation closed', {
        conversation_id: conversationId,
        status,
        turn_count: context.turns.length
      });

    } catch (error) {
      logger.error('Failed to close conversation', { error, conversationId });
      throw error;
    }
  }

  async getActiveConversations(agentId: string): Promise<ConversationContext[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_contexts')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(row => ({
        customer_id: row.customer_id,
        agent_id: row.agent_id,
        conversation_id: row.conversation_id,
        turns: row.turns || [],
        summary: row.summary,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) || [];

    } catch (error) {
      logger.error('Failed to get active conversations', { error });
      return [];
    }
  }

  private async storeConversationContext(context: ConversationContext): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_contexts')
        .upsert({
          conversation_id: context.conversation_id,
          customer_id: context.customer_id,
          agent_id: context.agent_id,
          turns: context.turns,
          summary: context.summary,
          status: context.status,
          created_at: context.created_at,
          updated_at: context.updated_at
        });

      if (error) {
        throw error;
      }

    } catch (error) {
      logger.error('Failed to store conversation context', { error });
      throw error;
    }
  }

  private async archiveOldTurns(context: ConversationContext): Promise<void> {
    try {
      // Keep last 20 turns and archive the rest
      const turnsToKeep = context.turns.slice(-20);
      const turnsToArchive = context.turns.slice(0, -20);

      if (turnsToArchive.length > 0) {
        // Store archived turns separately
        await supabase
          .from('conversation_archives')
          .insert({
            conversation_id: context.conversation_id,
            archived_turns: turnsToArchive,
            archived_at: new Date().toISOString()
          });

        context.turns = turnsToKeep;

        logger.debug('Archived old conversation turns', {
          conversation_id: context.conversation_id,
          archived_count: turnsToArchive.length
        });
      }

    } catch (error) {
      logger.error('Failed to archive old turns', { error });
      // Don't throw - this is not critical
    }
  }

  // Clean up old memory cache entries
  cleanupMemoryCache(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [conversationId, context] of this.memoryCache.entries()) {
      const lastUpdate = new Date(context.updated_at).getTime();
      if (lastUpdate < oneHourAgo) {
        this.memoryCache.delete(conversationId);
      }
    }
  }
}

export default ConversationMemoryService;