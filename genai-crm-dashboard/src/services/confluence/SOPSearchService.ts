import Fuse from 'fuse.js';
import {
  ConfluenceSOPDocument,
  CustomerQuery,
  RelevantSOP,
  SOPSearchResult,
  SOPSection
} from './types';

export class SOPSearchService {
  private fuseIndex: Fuse<ConfluenceSOPDocument> | null = null;
  private sops: ConfluenceSOPDocument[] = [];

  constructor() {
    // Future integration points for ConfluenceService and SOP database
  }

  async initialize(sops: ConfluenceSOPDocument[]): Promise<void> {
    this.sops = sops;
    
    // Configure Fuse.js for semantic search
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'cleanContent', weight: 0.4 },
        { name: 'keywords', weight: 0.2 },
        { name: 'category', weight: 0.1 }
      ],
      threshold: 0.4, // Lower = more strict matching
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 3,
      findAllMatches: true
    };

    this.fuseIndex = new Fuse(sops, fuseOptions);
    console.log(`🔍 Search index initialized with ${sops.length} SOPs`);
  }

  async findRelevantSOPs(query: CustomerQuery): Promise<RelevantSOP[]> {
    const startTime = Date.now();
    console.log(`🔎 Searching for SOPs relevant to: "${query.voc}"`);

    try {
      // Multi-strategy search
      const [semanticResults, keywordResults, categoryResults] = await Promise.all([
        this.semanticSearch(query),
        this.keywordSearch(query),
        this.categorySearch(query)
      ]);

      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults([
        ...semanticResults,
        ...keywordResults,
        ...categoryResults
      ]);

      // Score and rank results
      const rankedResults = this.rankResults(combinedResults, query);

      // Get top 5 most relevant SOPs
      const topResults = rankedResults.slice(0, 5);

      const searchTime = Date.now() - startTime;
      console.log(`✅ Search completed in ${searchTime}ms, found ${topResults.length} relevant SOPs`);

      return topResults;
    } catch (error) {
      console.error('❌ Error during SOP search:', error);
      return [];
    }
  }

  private async semanticSearch(query: CustomerQuery): Promise<RelevantSOP[]> {
    if (!this.fuseIndex) {
      console.warn('Search index not initialized');
      return [];
    }

    const searchQuery = `${query.voc} ${query.agentHelpText}`.toLowerCase();
    const results = this.fuseIndex.search(searchQuery);

    return results.map(result => {
      const sop = result.item;
      const relevanceScore = 1 - (result.score || 0); // Convert Fuse score to relevance

      // Find matching sections
      const matchedSections = this.findMatchingSections(sop, searchQuery);

      return {
        sop: {
          ...sop,
          searchScore: relevanceScore
        },
        relevanceScore,
        matchedSections,
        reasoning: `Semantic match: ${this.generateReasoningFromMatches([...(result.matches || [])])}`
      };
    });
  }

  private async keywordSearch(query: CustomerQuery): Promise<RelevantSOP[]> {
    const keywords = this.extractQueryKeywords(query.voc);
    const results: RelevantSOP[] = [];

    for (const sop of this.sops) {
      const matchScore = this.calculateKeywordMatchScore(sop, keywords);
      
      if (matchScore > 0.2) { // Minimum threshold
        const matchedSections = sop.sections.filter(section =>
          keywords.some(keyword => 
            section.content.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        results.push({
          sop: {
            ...sop,
            searchScore: matchScore
          },
          relevanceScore: matchScore,
          matchedSections,
          reasoning: `Keyword matches: ${keywords.join(', ')}`
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async categorySearch(query: CustomerQuery): Promise<RelevantSOP[]> {
    const queryCategory = this.categorizeQuery(query);
    
    if (queryCategory === 'unknown') {
      return [];
    }

    const categorySOPs = this.sops.filter(sop => sop.category === queryCategory);
    
    return categorySOPs.map(sop => ({
      sop: {
        ...sop,
        searchScore: 0.8 // High confidence for category matches
      },
      relevanceScore: 0.8,
      matchedSections: sop.sections.slice(0, 2), // Include first 2 sections
      reasoning: `Category match: ${queryCategory}`
    }));
  }

  private combineSearchResults(results: RelevantSOP[]): RelevantSOP[] {
    // Deduplicate by SOP ID and combine scores
    const sopMap = new Map<string, RelevantSOP>();

    for (const result of results) {
      const existing = sopMap.get(result.sop.id);
      
      if (existing) {
        // Combine scores using weighted average
        const combinedScore = (existing.relevanceScore * 0.7) + (result.relevanceScore * 0.3);
        const combinedReasoning = `${existing.reasoning}; ${result.reasoning}`;
        
        // Merge matched sections
        const allSections = [...existing.matchedSections, ...result.matchedSections];
        const uniqueSections = allSections.filter((section, index, array) => 
          array.findIndex(s => s.title === section.title) === index
        );

        sopMap.set(result.sop.id, {
          ...existing,
          relevanceScore: combinedScore,
          matchedSections: uniqueSections,
          reasoning: combinedReasoning
        });
      } else {
        sopMap.set(result.sop.id, result);
      }
    }

    return Array.from(sopMap.values());
  }

  private rankResults(results: RelevantSOP[], query: CustomerQuery): RelevantSOP[] {
    return results.map(result => {
      let finalScore = result.relevanceScore;

      // Boost recent SOPs
      const daysSinceUpdate = (Date.now() - result.sop.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        finalScore *= 1.1; // 10% boost for recent updates
      } else if (daysSinceUpdate > 180) {
        finalScore *= 0.9; // 10% penalty for old SOPs
      }

      // Boost if title closely matches query
      const titleMatch = this.calculateTitleMatchScore(result.sop.title, query.voc);
      finalScore += titleMatch * 0.2;

      // Boost if SOP has clear structure (more sections)
      const structureBonus = Math.min(result.sop.sections.length * 0.05, 0.2);
      finalScore += structureBonus;

      // Priority boost
      if (query.priority === 'urgent') {
        finalScore *= 1.15;
      } else if (query.priority === 'high') {
        finalScore *= 1.1;
      }

      return {
        ...result,
        relevanceScore: Math.min(finalScore, 1.0) // Cap at 1.0
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private findMatchingSections(sop: ConfluenceSOPDocument, searchQuery: string): SOPSection[] {
    const queryWords = searchQuery.toLowerCase().split(/\s+/);
    
    return sop.sections.filter(section => {
      const sectionText = `${section.title} ${section.content}`.toLowerCase();
      return queryWords.some(word => sectionText.includes(word));
    });
  }

  private extractQueryKeywords(query: string): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'cannot', 'cant', 'wont', 'dont', 'doesnt', 'didnt', 'hasnt', 'havent',
      'customer', 'user', 'client', 'wants', 'needs', 'asking', 'says', 'said'
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  private calculateKeywordMatchScore(sop: ConfluenceSOPDocument, keywords: string[]): number {
    const sopText = `${sop.title} ${sop.cleanContent}`.toLowerCase();
    let matchScore = 0;
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Title matches are worth more
      if (sop.title.toLowerCase().includes(keywordLower)) {
        matchScore += 0.3;
      }
      
      // Content matches
      const contentMatches = (sopText.match(new RegExp(keywordLower, 'g')) || []).length;
      matchScore += Math.min(contentMatches * 0.1, 0.4); // Cap content contribution
      
      // Keyword matches in SOP keywords
      if (sop.keywords.some(sopKeyword => sopKeyword.includes(keywordLower))) {
        matchScore += 0.2;
      }
    }

    return Math.min(matchScore / keywords.length, 1.0); // Normalize by keyword count
  }

  private categorizeQuery(query: CustomerQuery): string {
    const queryText = `${query.voc} ${query.agentHelpText}`.toLowerCase();
    
    const categoryPatterns = {
      'returns': /return|refund|exchange|money back|replacement/,
      'billing': /billing|payment|invoice|charge|subscription|price|cost|fee/,
      'shipping': /shipping|delivery|tracking|shipment|dispatch|mail|post/,
      'technical': /technical|troubleshoot|error|bug|issue|problem|not working|broken/,
      'account': /account|login|password|profile|registration|signup|sign up/,
      'product': /product|feature|functionality|specification|usage|how to/,
      'escalation': /escalate|manager|supervisor|complex|urgent|complaint/
    };

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(queryText)) {
        return category;
      }
    }

    return 'unknown';
  }

  private calculateTitleMatchScore(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact substring match
    if (titleLower.includes(queryLower)) {
      return 0.8;
    }
    
    // Word overlap
    const titleWords = titleLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    const overlap = titleWords.filter(word => queryWords.includes(word)).length;
    
    return overlap / Math.max(titleWords.length, queryWords.length);
  }

  private generateReasoningFromMatches(matches: any[]): string {
    if (!matches || matches.length === 0) {
      return 'General content match';
    }

    const matchTypes = matches.map(match => {
      if (match.key === 'title') return 'title';
      if (match.key === 'keywords') return 'keywords';
      if (match.key === 'category') return 'category';
      return 'content';
    });

    const uniqueTypes = [...new Set(matchTypes)];
    return `Matched in: ${uniqueTypes.join(', ')}`;
  }

  // Advanced search with filters
  async searchSOPsWithFilters(
    query: string,
    filters: {
      categories?: string[];
      updatedAfter?: Date;
      minQualityScore?: number;
    } = {}
  ): Promise<SOPSearchResult> {
    const startTime = Date.now();
    
    let filteredSOPs = this.sops;
    
    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
      filteredSOPs = filteredSOPs.filter(sop => filters.categories!.includes(sop.category));
    }
    
    if (filters.updatedAfter) {
      filteredSOPs = filteredSOPs.filter(sop => sop.lastModified >= filters.updatedAfter!);
    }

    // Create temporary Fuse index for filtered SOPs
    const tempFuse = new Fuse(filteredSOPs, {
      keys: ['title', 'cleanContent', 'keywords'],
      threshold: 0.4,
      includeScore: true
    });

    const results = tempFuse.search(query);
    const relevantSOPs = results.map(result => ({
      sop: result.item,
      relevanceScore: 1 - (result.score || 0),
      matchedSections: this.findMatchingSections(result.item, query),
      reasoning: 'Filtered search match'
    }));

    const searchTime = Date.now() - startTime;

    return {
      query,
      results: relevantSOPs,
      totalFound: relevantSOPs.length,
      searchTime,
      searchStrategy: 'hybrid'
    };
  }
}