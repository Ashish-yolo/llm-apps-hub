import { ConfluenceService } from './ConfluenceService';
import { SOPDiscoveryService } from './SOPDiscoveryService';
import { SOPSearchService } from './SOPSearchService';
import { ConfluenceAIContextBuilder } from './ConfluenceAIContextBuilder';
import { ConfluenceAIProcessor } from './ConfluenceAIProcessor';
import {
  ConfluenceConfig,
  ConfluenceSOPDocument,
  CustomerQuery,
  EnhancedAIResponse,
  SOPSyncResult
} from './types';

export class ConfluenceMCPManager {
  private confluenceService: ConfluenceService;
  private sopDiscoveryService: SOPDiscoveryService;
  private sopSearchService: SOPSearchService;
  private aiContextBuilder: ConfluenceAIContextBuilder;
  private aiProcessor: ConfluenceAIProcessor;
  
  private sops: ConfluenceSOPDocument[] = [];
  private lastSyncTime?: Date;
  private isInitialized = false;

  constructor(config: ConfluenceConfig, anthropicApiKey?: string) {
    // Initialize all services
    this.confluenceService = new ConfluenceService(config);
    this.sopDiscoveryService = new SOPDiscoveryService(this.confluenceService);
    this.sopSearchService = new SOPSearchService();
    this.aiContextBuilder = new ConfluenceAIContextBuilder(this.sopSearchService, this.confluenceService);
    this.aiProcessor = new ConfluenceAIProcessor(this.aiContextBuilder, anthropicApiKey);
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Confluence MCP Manager...');
    
    try {
      // 1. Initialize Confluence connection
      await this.confluenceService.initialize();
      
      // 2. Discover and index all SOPs
      await this.performInitialSOPSync();
      
      // 3. Initialize search service
      await this.sopSearchService.initialize(this.sops);
      
      this.isInitialized = true;
      console.log('✅ Confluence MCP Manager initialized successfully');
      
      // Log summary
      console.log(`📊 Summary: ${this.sops.length} SOPs indexed from Confluence`);
      console.log(`📚 Categories: ${this.getSOPCategoriesSummary()}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Confluence MCP Manager:', error);
      throw error;
    }
  }

  async performInitialSOPSync(): Promise<void> {
    console.log('📥 Performing initial SOP synchronization...');
    
    try {
      this.sops = await this.sopDiscoveryService.discoverAllSOPs();
      this.lastSyncTime = new Date();
      
      console.log(`✅ Initial sync complete: ${this.sops.length} SOPs discovered`);
      
      // Generate SOP quality report
      await this.generateSOPQualityReport();
      
    } catch (error) {
      console.error('❌ Initial SOP sync failed:', error);
      throw error;
    }
  }

  async performIncrementalSync(): Promise<SOPSyncResult> {
    console.log('🔄 Performing incremental SOP synchronization...');
    
    if (!this.isInitialized) {
      throw new Error('Manager not initialized. Call initialize() first.');
    }

    try {
      const result = await this.sopDiscoveryService.performIncrementalSync(this.lastSyncTime);
      
      // Refresh SOPs and search index if there were updates
      if (result.added > 0 || result.updated > 0) {
        console.log('🔄 Refreshing SOP index due to updates...');
        this.sops = await this.sopDiscoveryService.discoverAllSOPs();
        await this.sopSearchService.initialize(this.sops);
      }
      
      this.lastSyncTime = new Date();
      console.log(`✅ Incremental sync complete: ${result.added} added, ${result.updated} updated`);
      
      return result;
    } catch (error) {
      console.error('❌ Incremental sync failed:', error);
      throw error;
    }
  }

  async processCustomerQuery(query: CustomerQuery): Promise<EnhancedAIResponse> {
    if (!this.isInitialized) {
      throw new Error('Manager not initialized. Call initialize() first.');
    }

    console.log(`🎯 Processing customer query: ${query.ticketId}`);
    
    try {
      const response = await this.aiProcessor.processQueryWithConfluenceSOPs(query);
      
      // Log processing metrics
      console.log(`📈 Query processed - Confidence: ${response.confidenceScore}%, SOPs used: ${response.totalSOPsConsulted}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Error processing query ${query.ticketId}:`, error);
      throw error;
    }
  }

  async searchSOPs(searchQuery: string, filters?: {
    categories?: string[];
    updatedAfter?: Date;
  }): Promise<ConfluenceSOPDocument[]> {
    if (!this.isInitialized) {
      throw new Error('Manager not initialized. Call initialize() first.');
    }

    try {
      const results = await this.sopSearchService.searchSOPsWithFilters(searchQuery, filters);
      return results.results.map(r => r.sop);
    } catch (error) {
      console.error('❌ Error searching SOPs:', error);
      throw error;
    }
  }

  async getSOPById(sopId: string): Promise<ConfluenceSOPDocument | null> {
    return this.sops.find(sop => sop.id === sopId) || null;
  }

  async getSOPsByCategory(category: string): Promise<ConfluenceSOPDocument[]> {
    return this.sops.filter(sop => sop.category === category);
  }

  getSOPStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    avgQualityScore: number;
    lastSync: Date | undefined;
    freshness: {
      fresh: number;
      stale: number;
      outdated: number;
    };
  } {
    const byCategory: Record<string, number> = {};
    let totalQualityScore = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let fresh = 0, stale = 0, outdated = 0;

    this.sops.forEach(sop => {
      // Count by category
      byCategory[sop.category] = (byCategory[sop.category] || 0) + 1;
      
      // Calculate freshness
      if (sop.lastModified >= thirtyDaysAgo) {
        fresh++;
      } else if (sop.lastModified >= ninetyDaysAgo) {
        stale++;
      } else {
        outdated++;
      }
    });

    return {
      total: this.sops.length,
      byCategory,
      avgQualityScore: totalQualityScore / this.sops.length || 0,
      lastSync: this.lastSyncTime,
      freshness: { fresh, stale, outdated }
    };
  }

  private getSOPCategoriesSummary(): string {
    const categories = this.sops.reduce((acc, sop) => {
      acc[sop.category] = (acc[sop.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([category, count]) => `${category} (${count})`)
      .join(', ');
  }

  private async generateSOPQualityReport(): Promise<void> {
    console.log('📊 Generating SOP quality report...');
    
    const qualityPromises = this.sops.map(sop => 
      this.sopDiscoveryService.validateSOPQuality(sop)
    );
    
    const qualityResults = await Promise.all(qualityPromises);
    
    const avgScore = qualityResults.reduce((sum, result) => sum + result.score, 0) / qualityResults.length;
    const validSOPs = qualityResults.filter(result => result.isValid).length;
    const commonIssues = qualityResults
      .flatMap(result => result.issues)
      .reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    console.log(`📈 SOP Quality Report:`);
    console.log(`   Average Score: ${avgScore.toFixed(1)}%`);
    console.log(`   Valid SOPs: ${validSOPs}/${this.sops.length} (${((validSOPs/this.sops.length)*100).toFixed(1)}%)`);
    console.log(`   Common Issues:`, Object.entries(commonIssues).slice(0, 3));
  }

  // Webhook handler for real-time updates
  async handleConfluenceWebhook(payload: any): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ Webhook received but manager not initialized');
      return;
    }

    try {
      await this.confluenceService.handleWebhook(payload);
      
      // Trigger incremental sync to pick up changes
      setTimeout(() => {
        this.performIncrementalSync().catch(error => 
          console.error('❌ Auto-sync after webhook failed:', error)
        );
      }, 5000); // 5 second delay to allow Confluence to process changes
      
    } catch (error) {
      console.error('❌ Error handling Confluence webhook:', error);
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      confluenceConnection: boolean;
      sopCount: number;
      lastSync: string;
      searchIndex: boolean;
    };
  }> {
    try {
      // Test Confluence connection
      await this.confluenceService.verifyCSSpaceAccess();
      const confluenceConnection = true;
      
      const details = {
        confluenceConnection,
        sopCount: this.sops.length,
        lastSync: this.lastSyncTime?.toISOString() || 'Never',
        searchIndex: this.sopSearchService !== null
      };

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!confluenceConnection || this.sops.length === 0) {
        status = 'unhealthy';
      } else if (!this.lastSyncTime || (Date.now() - this.lastSyncTime.getTime()) > 24 * 60 * 60 * 1000) {
        status = 'degraded'; // No sync in 24 hours
      }

      return { status, details };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          confluenceConnection: false,
          sopCount: this.sops.length,
          lastSync: this.lastSyncTime?.toISOString() || 'Never',
          searchIndex: false
        }
      };
    }
  }

  // Export SOPs for backup or analysis
  async exportSOPs(): Promise<string> {
    return await this.sopDiscoveryService.exportSOPsToJSON();
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Confluence MCP Manager...');
    // Add any cleanup logic here
    this.isInitialized = false;
  }
}