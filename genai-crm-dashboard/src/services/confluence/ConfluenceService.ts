import ConfluenceAPI from 'confluence-api';
import * as cheerio from 'cheerio';
import {
  ConfluenceConfig,
  ConfluencePage,
  ConfluenceSOPDocument,
  SOPSection,
  ConfluenceWebhookPayload
} from './types';

export class ConfluenceService {
  private confluence: ConfluenceAPI;
  private config: ConfluenceConfig;

  constructor(config: ConfluenceConfig) {
    this.config = config;
    this.confluence = new ConfluenceAPI({
      username: config.username,
      password: config.apiToken,
      baseUrl: config.baseUrl,
      version: 4 // API version
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection and verify CS Space access
      await this.verifyCSSpaceAccess();
      console.log('✅ Confluence MCP integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Confluence integration:', error);
      throw error;
    }
  }

  async verifyCSSpaceAccess(): Promise<void> {
    try {
      const spaceInfo = await this.confluence.getSpace(this.config.spaceKey);
      console.log(`🔗 Connected to CS Space: ${spaceInfo.name}`);
    } catch (error) {
      throw new Error(`Failed to access CS Space "${this.config.spaceKey}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAllPagesFromCSSpace(): Promise<ConfluencePage[]> {
    try {
      const pages: ConfluencePage[] = [];
      let start = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await this.confluence.getContentBySpace(this.config.spaceKey, {
          start,
          limit,
          expand: 'body.storage,version,metadata.labels'
        });

        if (response && response.results) {
          pages.push(...response.results);
          hasMore = response.size === limit;
          start += limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`📄 Found ${pages.length} pages in CS Space`);
      return pages;
    } catch (error) {
      console.error('Error fetching pages from CS Space:', error);
      throw error;
    }
  }

  async getPageById(pageId: string): Promise<ConfluencePage> {
    try {
      return await this.confluence.getContentById(pageId, {
        expand: 'body.storage,version,metadata.labels'
      });
    } catch (error) {
      console.error(`Error fetching page ${pageId}:`, error);
      throw error;
    }
  }

  async searchPages(query: string): Promise<ConfluencePage[]> {
    try {
      const cqlQuery = `space = ${this.config.spaceKey} AND text ~ "${query}"`;
      const response = await this.confluence.search(cqlQuery, {
        limit: 50,
        expand: 'content.body.storage,content.version'
      });

      if (response && response.results) {
        return response.results.map((result: any) => result.content).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching Confluence:', error);
      return [];
    }
  }

  isSOPDocument(page: ConfluencePage): boolean {
    const sopKeywords = ['sop', 'procedure', 'policy', 'process', 'guideline', 'standard', 'workflow'];
    const titleLower = page.title.toLowerCase();

    // Check title for SOP keywords
    const titleMatch = sopKeywords.some(keyword => titleLower.includes(keyword));

    // Check labels for SOP tags
    const labelMatch = page.metadata?.labels?.results?.some(label => 
      sopKeywords.includes(label.name.toLowerCase())
    ) || false;

    // Additional checks for customer service specific terms
    const csKeywords = ['customer', 'support', 'service', 'help', 'ticket', 'case', 'issue'];
    const csMatch = csKeywords.some(keyword => titleLower.includes(keyword));

    return titleMatch || labelMatch || csMatch;
  }

  cleanConfluenceHTML(htmlContent: string): string {
    // Use cheerio to parse and clean HTML
    const $ = cheerio.load(htmlContent);
    
    // Remove Confluence-specific elements
    $('ac\\:structured-macro').remove();
    $('ac\\:parameter').remove();
    $('ac\\:rich-text-body').remove();
    
    // Get clean text and preserve basic structure
    let cleanText = $.text();
    
    // Clean up whitespace
    cleanText = cleanText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return cleanText;
  }

  parseSOPSections(content: string): SOPSection[] {
    const sections: SOPSection[] = [];
    
    // Split by headers (using common header patterns)
    const headerPatterns = [
      /^#+\s+(.+)$/gm, // Markdown headers
      /^(.+)\n[=-]{3,}$/gm, // Underlined headers
      /^\d+\.\s+(.+)$/gm, // Numbered sections
      /^[A-Z][A-Z\s]+:?\s*$/gm // ALL CAPS headers
    ];

    let sectionMatches: Array<{title: string, start: number, end: number}> = [];
    
    // Find all potential section headers
    headerPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        sectionMatches.push({
          title: match[1] || match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });

    // Sort by position and extract content between headers
    sectionMatches.sort((a, b) => a.start - b.start);

    for (let i = 0; i < sectionMatches.length; i++) {
      const current = sectionMatches[i];
      const next = sectionMatches[i + 1];
      
      const sectionStart = current.end;
      const sectionEnd = next ? next.start : content.length;
      const sectionContent = content.substring(sectionStart, sectionEnd).trim();

      if (sectionContent.length > 10) { // Only include substantial sections
        sections.push({
          title: current.title.trim(),
          content: sectionContent,
          keywords: this.extractKeywords(sectionContent),
          orderIndex: i
        });
      }
    }

    // If no clear sections found, create a single section
    if (sections.length === 0) {
      sections.push({
        title: 'Main Content',
        content: content.trim(),
        keywords: this.extractKeywords(content),
        orderIndex: 0
      });
    }

    return sections;
  }

  extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 
      'did', 'will', 'this', 'that', 'they', 'them', 'with', 'have', 'from',
      'when', 'where', 'what', 'why', 'how', 'which', 'while', 'during',
      'before', 'after', 'above', 'below', 'between', 'through', 'under'
    ]);

    const keywords = words
      .filter(word => !stopWords.has(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Return top 10 most frequent keywords
    return Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  categorizeSOPDocument(title: string, content: string): string {
    const categories = {
      'returns': ['return', 'refund', 'exchange', 'replacement', 'money back'],
      'billing': ['billing', 'payment', 'invoice', 'charge', 'subscription', 'price'],
      'shipping': ['shipping', 'delivery', 'tracking', 'shipment', 'dispatch'],
      'technical': ['technical', 'troubleshoot', 'error', 'bug', 'issue', 'problem'],
      'account': ['account', 'login', 'password', 'profile', 'registration', 'signup'],
      'product': ['product', 'feature', 'functionality', 'specification', 'usage'],
      'escalation': ['escalate', 'manager', 'supervisor', 'complex', 'urgent'],
      'general': []
    };

    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Score each category based on keyword matches
    const categoryScores: Record<string, number> = {};
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.length === 0) continue; // Skip general category
      
      categoryScores[category] = keywords.reduce((score, keyword) => {
        const titleMatches = (titleLower.match(new RegExp(keyword, 'g')) || []).length * 3; // Title matches worth more
        const contentMatches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
        return score + titleMatches + contentMatches;
      }, 0);
    }

    // Find category with highest score
    const bestCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .find(([,score]) => score > 0);

    return bestCategory ? bestCategory[0] : 'general';
  }

  async extractSOPContent(page: ConfluencePage): Promise<ConfluenceSOPDocument> {
    try {
      // Extract clean text content from Confluence storage format
      const cleanContent = this.cleanConfluenceHTML(page.body.storage.value);
      
      // Parse content into sections
      const sections = this.parseSOPSections(cleanContent);
      
      // Determine category based on title/content
      const category = this.categorizeSOPDocument(page.title, cleanContent);
      
      // Extract keywords from entire document
      const keywords = this.extractKeywords(`${page.title} ${cleanContent}`);

      return {
        id: page.id,
        title: page.title,
        content: page.body.storage.value, // Keep original HTML
        cleanContent: cleanContent,
        url: `${this.config.baseUrl}${page._links.webui}`,
        lastModified: new Date(page.version.when),
        version: page.version.number,
        labels: page.metadata?.labels?.results?.map(l => l.name) || [],
        sections: sections,
        category: category,
        keywords: keywords
      };
    } catch (error) {
      console.error(`Error extracting SOP content for page ${page.id}:`, error);
      throw error;
    }
  }

  async handleWebhook(payload: ConfluenceWebhookPayload): Promise<void> {
    console.log(`📢 Confluence webhook received: ${payload.event} for page ${payload.page.title}`);
    
    // Only process CS Space updates
    if (payload.page.spaceKey !== this.config.spaceKey) {
      return;
    }

    try {
      switch (payload.event) {
        case 'page_updated':
          await this.handlePageUpdate(payload.page.id);
          break;
        case 'page_created':
          await this.handlePageCreate(payload.page.id);
          break;
        case 'page_removed':
          await this.handlePageRemove(payload.page.id);
          break;
      }
    } catch (error) {
      console.error(`Error handling webhook for page ${payload.page.id}:`, error);
    }
  }

  private async handlePageUpdate(pageId: string): Promise<void> {
    try {
      const page = await this.getPageById(pageId);
      if (this.isSOPDocument(page)) {
        console.log(`🔄 Updating SOP: ${page.title}`);
        // This would integrate with your SOP database/cache
        // await this.sopDatabase.updateSOP(await this.extractSOPContent(page));
      }
    } catch (error) {
      console.error(`Error updating page ${pageId}:`, error);
    }
  }

  private async handlePageCreate(pageId: string): Promise<void> {
    try {
      const page = await this.getPageById(pageId);
      if (this.isSOPDocument(page)) {
        console.log(`➕ New SOP discovered: ${page.title}`);
        // This would integrate with your SOP database/cache
        // await this.sopDatabase.addSOP(await this.extractSOPContent(page));
      }
    } catch (error) {
      console.error(`Error creating page ${pageId}:`, error);
    }
  }

  private async handlePageRemove(pageId: string): Promise<void> {
    console.log(`🗑️ SOP removed: ${pageId}`);
    // This would integrate with your SOP database/cache
    // await this.sopDatabase.removeSOP(pageId);
  }
}