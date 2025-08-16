import { SOPSearchService } from './SOPSearchService';
import { ConfluenceService } from './ConfluenceService';
import {
  CustomerQuery,
  EnhancedAIContext,
  RelevantSOP
} from './types';

export class ConfluenceAIContextBuilder {
  constructor(
    private sopSearchService: SOPSearchService,
    private confluenceService: ConfluenceService
  ) {}

  async buildRichContext(query: CustomerQuery): Promise<EnhancedAIContext> {
    console.log(`🔧 Building rich AI context for ticket: ${query.ticketId}`);
    
    try {
      // 1. Get relevant SOPs from Confluence
      const relevantSOPs = await this.sopSearchService.findRelevantSOPs(query);
      console.log(`📚 Found ${relevantSOPs.length} relevant SOPs`);

      // 2. Enrich with live Confluence data
      const enrichedSOPs = await this.enrichSOPsWithLiveData(relevantSOPs);

      // 3. Get additional context
      const [productContext, customerHistory] = await Promise.all([
        this.getProductContext(query),
        this.getCustomerHistory(query)
      ]);

      // 4. Build comprehensive context
      const context: EnhancedAIContext = {
        customerIssue: query.voc,
        agentNotes: query.agentHelpText,
        ticketId: query.ticketId,
        customerId: query.customerId,
        priority: query.priority,
        
        // Rich SOP context from Confluence
        relevantProcedures: enrichedSOPs.map(enrichedSOP => ({
          title: enrichedSOP.sop.title,
          procedure: enrichedSOP.sop.cleanContent,
          lastUpdated: enrichedSOP.sop.lastModified,
          confluenceUrl: enrichedSOP.sop.url,
          version: enrichedSOP.sop.version,
          category: enrichedSOP.sop.category,
          sections: enrichedSOP.sop.sections,
          relevanceScore: enrichedSOP.relevanceScore
        })),
        
        // Additional context
        productContext,
        customerHistory,
        
        // Metadata for response validation
        sopSources: enrichedSOPs.map(enrichedSOP => ({
          title: enrichedSOP.sop.title,
          url: enrichedSOP.sop.url,
          lastUpdated: enrichedSOP.sop.lastModified,
          version: enrichedSOP.sop.version
        }))
      };

      console.log(`✅ Rich context built with ${context.relevantProcedures.length} procedures`);
      return context;
    } catch (error) {
      console.error('❌ Error building AI context:', error);
      throw error;
    }
  }

  private async enrichSOPsWithLiveData(sops: RelevantSOP[]): Promise<RelevantSOP[]> {
    console.log('🔄 Enriching SOPs with live Confluence data...');
    
    const enrichedSOPs = await Promise.all(
      sops.map(async sopResult => {
        try {
          // Get latest page version from Confluence
          const latestPage = await this.confluenceService.getPageById(sopResult.sop.id);
          
          // Check if our cached version is outdated
          if (latestPage.version.number > sopResult.sop.version) {
            console.log(`🔄 SOP outdated: ${sopResult.sop.title}, updating from v${sopResult.sop.version} to v${latestPage.version.number}`);
            
            // Extract fresh content
            const updatedSOP = await this.confluenceService.extractSOPContent(latestPage);
            
            return {
              ...sopResult,
              sop: updatedSOP
            };
          }
          
          console.log(`✅ SOP up-to-date: ${sopResult.sop.title} v${sopResult.sop.version}`);
          return sopResult;
        } catch (error) {
          console.warn(`⚠️ Failed to check SOP freshness: ${sopResult.sop.title}`, error);
          return sopResult; // Use cached version as fallback
        }
      })
    );
    
    return enrichedSOPs;
  }

  private async getProductContext(query: CustomerQuery): Promise<any> {
    // Extract product information from query
    const productKeywords = this.extractProductKeywords(query.voc);
    
    if (productKeywords.length === 0) {
      return null;
    }

    // This would integrate with your product database/catalog
    // For now, return a mock structure
    return {
      detectedProducts: productKeywords,
      productDetails: productKeywords.map(keyword => ({
        name: keyword,
        category: 'Unknown',
        version: 'Latest',
        supportLevel: 'Standard'
      }))
    };
  }

  private async getCustomerHistory(query: CustomerQuery): Promise<any> {
    if (!query.customerId) {
      return null;
    }

    // This would integrate with your customer service database
    // For now, return a mock structure
    return {
      customerId: query.customerId,
      tierLevel: 'Standard',
      previousTickets: 0,
      commonIssues: [],
      preferredContact: 'email'
    };
  }

  private extractProductKeywords(text: string): string[] {
    // Common product-related keywords in customer service
    const productPatterns = [
      /\b[A-Z][a-z]+ \d+/g, // Product names with versions (e.g., "iPhone 12")
      /\b[A-Z]{2,}/g, // Acronyms (e.g., "API", "SDK")
      /\bmodel \w+/gi, // Model references
      /\bversion \d+/gi, // Version references
    ];

    const keywords = new Set<string>();
    
    productPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.trim()));
      }
    });

    return Array.from(keywords).slice(0, 5); // Limit to 5 product keywords
  }

  // Advanced context building with confidence scoring
  async buildContextWithConfidence(query: CustomerQuery): Promise<EnhancedAIContext & {
    confidenceMetrics: {
      sopRelevance: number;
      contentFreshness: number;
      queryClarity: number;
      overallConfidence: number;
    };
  }> {
    const baseContext = await this.buildRichContext(query);
    
    // Calculate confidence metrics
    const sopRelevance = this.calculateSOPRelevanceConfidence(baseContext.relevantProcedures);
    const contentFreshness = this.calculateContentFreshnessConfidence(baseContext.sopSources);
    const queryClarity = this.calculateQueryClarityConfidence(query);
    const overallConfidence = (sopRelevance + contentFreshness + queryClarity) / 3;

    return {
      ...baseContext,
      confidenceMetrics: {
        sopRelevance,
        contentFreshness,
        queryClarity,
        overallConfidence
      }
    };
  }

  private calculateSOPRelevanceConfidence(procedures: any[]): number {
    if (procedures.length === 0) return 0;
    
    const avgRelevance = procedures.reduce((sum, proc) => sum + proc.relevanceScore, 0) / procedures.length;
    const hasHighConfidenceSOP = procedures.some(proc => proc.relevanceScore > 0.8);
    
    let confidence = avgRelevance;
    if (hasHighConfidenceSOP) confidence += 0.1;
    if (procedures.length >= 3) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private calculateContentFreshnessConfidence(sources: any[]): number {
    if (sources.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    let confidence = 0;
    sources.forEach(source => {
      if (source.lastUpdated >= thirtyDaysAgo) {
        confidence += 1.0;
      } else if (source.lastUpdated >= ninetyDaysAgo) {
        confidence += 0.7;
      } else {
        confidence += 0.4;
      }
    });
    
    return Math.min(confidence / sources.length, 1.0);
  }

  private calculateQueryClarityConfidence(query: CustomerQuery): number {
    let confidence = 0.5; // Base confidence
    
    // Check query length
    const wordCount = query.voc.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 50) {
      confidence += 0.2;
    }
    
    // Check for specific keywords
    const specificKeywords = /\b(error|issue|problem|help|support|how|why|when|where)\b/gi;
    if (specificKeywords.test(query.voc)) {
      confidence += 0.15;
    }
    
    // Check agent context
    if (query.agentHelpText && query.agentHelpText.length > 10) {
      confidence += 0.15;
    }
    
    // Check priority
    if (query.priority && query.priority !== 'low') {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Generate context summary for logging/debugging
  generateContextSummary(context: EnhancedAIContext): string {
    const summary = {
      ticketId: context.ticketId,
      customerIssue: context.customerIssue.substring(0, 100) + '...',
      sopCount: context.relevantProcedures.length,
      topCategories: [...new Set(context.relevantProcedures.map(p => p.category))].slice(0, 3),
      avgRelevance: context.relevantProcedures.length > 0 
        ? (context.relevantProcedures.reduce((sum, p) => sum + p.relevanceScore, 0) / context.relevantProcedures.length).toFixed(2)
        : '0',
      freshestSOP: context.sopSources.length > 0 
        ? context.sopSources.reduce((newest, source) => 
            source.lastUpdated > newest.lastUpdated ? source : newest
          ).title
        : 'None'
    };

    return JSON.stringify(summary, null, 2);
  }

  // Validate context quality before AI processing
  validateContextQuality(context: EnhancedAIContext): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if we have relevant SOPs
    if (context.relevantProcedures.length === 0) {
      issues.push('No relevant SOPs found');
      recommendations.push('Consider expanding search criteria or updating SOP repository');
    }

    // Check SOP relevance scores
    const avgRelevance = context.relevantProcedures.length > 0
      ? context.relevantProcedures.reduce((sum, p) => sum + p.relevanceScore, 0) / context.relevantProcedures.length
      : 0;

    if (avgRelevance < 0.3) {
      issues.push('Low SOP relevance scores');
      recommendations.push('Review query categorization or SOP keyword tagging');
    }

    // Check SOP freshness
    const oldSOPs = context.sopSources.filter(source => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return source.lastUpdated < sixMonthsAgo;
    });

    if (oldSOPs.length > 0) {
      issues.push(`${oldSOPs.length} SOPs are over 6 months old`);
      recommendations.push('Schedule SOP review and updates');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}