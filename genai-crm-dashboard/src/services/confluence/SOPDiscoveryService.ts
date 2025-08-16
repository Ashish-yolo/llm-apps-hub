import { ConfluenceService } from './ConfluenceService';
import {
  ConfluenceSOPDocument,
  SOPSyncResult,
  ConfluencePage
} from './types';

export class SOPDiscoveryService {
  constructor(private confluenceService: ConfluenceService) {}

  async discoverAllSOPs(): Promise<ConfluenceSOPDocument[]> {
    console.log('🔍 Starting SOP discovery in CS Space...');
    
    try {
      // Get all pages from CS Space
      const allPages = await this.confluenceService.getAllPagesFromCSSpace();
      console.log(`📄 Analyzing ${allPages.length} pages for SOPs...`);

      const sops: ConfluenceSOPDocument[] = [];
      const processingPromises: Promise<void>[] = [];

      // Process pages in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < allPages.length; i += batchSize) {
        const batch = allPages.slice(i, i + batchSize);
        
        const batchPromise = this.processBatch(batch, sops);
        processingPromises.push(batchPromise);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < allPages.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      // Wait for all batches to complete
      await Promise.all(processingPromises);

      console.log(`✅ SOP discovery complete! Found ${sops.length} SOPs out of ${allPages.length} pages`);
      
      // Sort by category and title for better organization
      sops.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });

      return sops;
    } catch (error) {
      console.error('❌ Error during SOP discovery:', error);
      throw error;
    }
  }

  private async processBatch(pages: ConfluencePage[], sops: ConfluenceSOPDocument[]): Promise<void> {
    const promises = pages.map(async (page) => {
      try {
        if (this.confluenceService.isSOPDocument(page)) {
          console.log(`📋 Processing SOP: ${page.title}`);
          const sop = await this.confluenceService.extractSOPContent(page);
          sops.push(sop);
        }
      } catch (error) {
        console.error(`❌ Error processing page ${page.title}:`, error instanceof Error ? error.message : String(error));
      }
    });

    await Promise.all(promises);
  }

  async performIncrementalSync(lastSyncTime?: Date): Promise<SOPSyncResult> {
    console.log('🔄 Starting incremental SOP sync...');
    
    const result: SOPSyncResult = {
      total: 0,
      updated: 0,
      added: 0,
      removed: 0,
      errors: []
    };

    try {
      // Get all current pages
      const allPages = await this.confluenceService.getAllPagesFromCSSpace();
      result.total = allPages.length;

      // Filter pages updated since last sync
      const updatedPages = lastSyncTime 
        ? allPages.filter(page => new Date(page.version.when) > lastSyncTime)
        : allPages;

      console.log(`📊 Found ${updatedPages.length} pages to sync (${allPages.length} total)`);

      // Process updated pages
      for (const page of updatedPages) {
        try {
          if (this.confluenceService.isSOPDocument(page)) {
            const sop = await this.confluenceService.extractSOPContent(page);
            
            // Determine if this is new or updated
            // This would integrate with your SOP storage system
            const isNewSOP = await this.isNewSOP(sop.id);
            
            if (isNewSOP) {
              result.added++;
              console.log(`➕ New SOP: ${sop.title}`);
            } else {
              result.updated++;
              console.log(`🔄 Updated SOP: ${sop.title}`);
            }

            // Store the SOP (this would integrate with your database)
            await this.storeSOP(sop);
          }
        } catch (error) {
          result.errors.push({
            pageId: page.id,
            error: error instanceof Error ? error.message : String(error)
          });
          console.error(`❌ Error syncing page ${page.title}:`, error instanceof Error ? error.message : String(error));
        }
      }

      console.log(`✅ Incremental sync complete: ${result.added} added, ${result.updated} updated, ${result.errors.length} errors`);
      return result;
    } catch (error) {
      console.error('❌ Error during incremental sync:', error);
      throw error;
    }
  }

  async validateSOPQuality(sop: ConfluenceSOPDocument): Promise<{
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check content length
    if (sop.cleanContent.length < 100) {
      issues.push('Content too short (less than 100 characters)');
      score -= 20;
    }

    // Check for step-by-step structure
    const hasSteps = /\d+\.\s|\n-\s|\n\*\s/.test(sop.cleanContent);
    if (!hasSteps) {
      issues.push('No clear step-by-step structure found');
      suggestions.push('Add numbered steps or bullet points for clarity');
      score -= 15;
    }

    // Check for common SOP elements
    const hasBackground = /background|overview|purpose|scope/i.test(sop.cleanContent);
    if (!hasBackground) {
      suggestions.push('Consider adding background/purpose section');
      score -= 5;
    }

    const hasConclusion = /conclusion|result|outcome|next steps/i.test(sop.cleanContent);
    if (!hasConclusion) {
      suggestions.push('Consider adding conclusion or next steps section');
      score -= 5;
    }

    // Check section count
    if (sop.sections.length < 2) {
      issues.push('Very few sections - consider breaking down content');
      score -= 10;
    }

    // Check for outdated content (if not updated in 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (sop.lastModified < sixMonthsAgo) {
      suggestions.push('SOP may need review (last updated over 6 months ago)');
      score -= 5;
    }

    // Check for contact information or escalation paths
    const hasEscalation = /escalate|manager|supervisor|contact|email|phone/i.test(sop.cleanContent);
    if (!hasEscalation) {
      suggestions.push('Consider adding escalation paths or contact information');
      score -= 5;
    }

    return {
      isValid: score >= 60, // Minimum 60% score to be considered valid
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  async generateSOPIndex(): Promise<{
    categories: Record<string, number>;
    keywords: Record<string, number>;
    totalSOPs: number;
    avgQualityScore: number;
  }> {
    console.log('📊 Generating SOP index...');
    
    const sops = await this.discoverAllSOPs();
    const categories: Record<string, number> = {};
    const keywords: Record<string, number> = {};
    let totalQualityScore = 0;

    for (const sop of sops) {
      // Count categories
      categories[sop.category] = (categories[sop.category] || 0) + 1;

      // Count keywords
      sop.keywords.forEach(keyword => {
        keywords[keyword] = (keywords[keyword] || 0) + 1;
      });

      // Calculate quality score
      const quality = await this.validateSOPQuality(sop);
      totalQualityScore += quality.score;
    }

    const avgQualityScore = sops.length > 0 ? totalQualityScore / sops.length : 0;

    console.log(`📈 Index generated: ${sops.length} SOPs, ${Object.keys(categories).length} categories, avg quality: ${avgQualityScore.toFixed(1)}%`);

    return {
      categories,
      keywords,
      totalSOPs: sops.length,
      avgQualityScore
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async isNewSOP(_sopId: string): Promise<boolean> {
    // This would check your SOP storage system
    // For now, we'll assume all are new in the initial implementation
    return true;
  }

  private async storeSOP(sop: ConfluenceSOPDocument): Promise<void> {
    // This would integrate with your SOP storage system
    // For now, just log the storage action
    console.log(`💾 Storing SOP: ${sop.title} (Category: ${sop.category})`);
  }

  // Utility method to export SOPs to JSON for backup/analysis
  async exportSOPsToJSON(): Promise<string> {
    const sops = await this.discoverAllSOPs();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalSOPs: sops.length,
      sops: sops.map(sop => ({
        id: sop.id,
        title: sop.title,
        category: sop.category,
        lastModified: sop.lastModified,
        url: sop.url,
        keywords: sop.keywords,
        sectionCount: sop.sections.length,
        contentLength: sop.cleanContent.length
      }))
    }, null, 2);
  }
}