// Confluence MCP Integration - Main Export File
export { ConfluenceMCPManager } from './ConfluenceMCPManager';
export { ConfluenceService } from './ConfluenceService';
export { SOPDiscoveryService } from './SOPDiscoveryService';
export { SOPSearchService } from './SOPSearchService';
export { ConfluenceAIContextBuilder } from './ConfluenceAIContextBuilder';
export { ConfluenceAIProcessor } from './ConfluenceAIProcessor';

export type {
  ConfluenceConfig,
  ConfluencePage,
  ConfluenceSOPDocument,
  SOPSection,
  CustomerQuery,
  RelevantSOP,
  EnhancedAIContext,
  EnhancedAIResponse,
  ConfluenceWebhookPayload,
  SOPSyncResult,
  SOPSearchResult
} from './types';