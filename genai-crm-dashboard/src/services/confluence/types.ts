// Confluence integration types
export interface ConfluenceConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  spaceKey: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  body: {
    storage: {
      value: string;
      representation: string;
    };
  };
  version: {
    number: number;
    when: string;
  };
  metadata?: {
    labels?: {
      results: Array<{
        name: string;
        id: string;
      }>;
    };
  };
  _links: {
    webui: string;
    self: string;
  };
}

export interface SOPSection {
  title: string;
  content: string;
  keywords: string[];
  orderIndex: number;
}

export interface ConfluenceSOPDocument {
  id: string;
  title: string;
  content: string;
  cleanContent: string;
  url: string;
  lastModified: Date;
  version: number;
  labels: string[];
  sections: SOPSection[];
  category: string;
  keywords: string[];
  searchScore?: number;
}

export interface CustomerQuery {
  voc: string; // Voice of Customer - the actual issue
  agentHelpText: string; // Agent's additional context
  ticketId: string;
  customerId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

export interface RelevantSOP {
  sop: ConfluenceSOPDocument;
  relevanceScore: number;
  matchedSections: SOPSection[];
  reasoning: string;
}

export interface EnhancedAIContext {
  customerIssue: string;
  agentNotes: string;
  ticketId: string;
  customerId?: string;
  priority?: string;
  
  // Rich SOP context from Confluence
  relevantProcedures: Array<{
    title: string;
    procedure: string;
    lastUpdated: Date;
    confluenceUrl: string;
    version: number;
    category: string;
    sections: SOPSection[];
    relevanceScore: number;
  }>;
  
  // Additional context
  productContext?: any;
  customerHistory?: any;
  
  // Metadata for response validation
  sopSources: Array<{
    title: string;
    url: string;
    lastUpdated: Date;
    version: number;
  }>;
}

export interface EnhancedAIResponse {
  processSteps: Array<{
    step: number;
    action: string;
    sopReference: string;
    confluenceUrl: string;
    reasoning?: string;
  }>;
  suggestedResponse: string;
  classification: 'sop_based' | 'new_scenario' | 'unclear';
  confidenceScore: number;
  sopSources: Array<{
    title: string;
    url: string;
    version: string;
    relevanceScore: number;
  }>;
  reasoning: string;
  escalationNeeded: boolean;
  additionalResources: string[];
  
  // Confluence-specific metadata
  lastSOPUpdate?: Date;
  sopFreshness: 'fresh' | 'stale' | 'outdated';
  totalSOPsConsulted: number;
}

export interface ConfluenceWebhookPayload {
  event: 'page_created' | 'page_updated' | 'page_removed';
  page: {
    id: string;
    title: string;
    spaceKey: string;
    url: string;
  };
  timestamp: string;
  user: {
    displayName: string;
    email: string;
  };
}

export interface SOPSyncResult {
  total: number;
  updated: number;
  added: number;
  removed: number;
  errors: Array<{
    pageId: string;
    error: string;
  }>;
}

export interface SOPSearchResult {
  query: string;
  results: RelevantSOP[];
  totalFound: number;
  searchTime: number;
  searchStrategy: 'semantic' | 'keyword' | 'category' | 'hybrid';
}