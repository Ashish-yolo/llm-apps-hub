// Repository Configuration Types
export type RepositoryType = 'confluence' | 'notion' | 'sharepoint' | 'google-docs' | 'github' | 'gitbook' | 'custom-api';

export interface RepositoryConfig {
  id: string;
  name: string;
  type: RepositoryType;
  isActive: boolean;
  credentials: Record<string, string>;
  settings: RepositorySettings;
  createdAt: Date;
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  documentsCount: number;
  categoriesCount: number;
}

export interface RepositorySettings {
  spaceKey?: string; // For Confluence
  databaseId?: string; // For Notion
  driveId?: string; // For Google Drive
  repoUrl?: string; // For GitHub
  syncInterval: number; // in minutes
  autoSync: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  contentFilters: ContentFilter[];
}

export interface ContentFilter {
  type: 'title' | 'content' | 'label' | 'path';
  pattern: string;
  action: 'include' | 'exclude';
}

export interface RepositoryConnector {
  type: RepositoryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresAuth: boolean;
  authFields: AuthField[];
  settingsFields: SettingsField[];
  testConnection: (credentials: Record<string, string>) => Promise<boolean>;
  discoverContent: (config: RepositoryConfig) => Promise<ContentSummary>;
}

export interface AuthField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: { value: string; label: string }[];
}

export interface SettingsField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'multiselect';
  defaultValue: any;
  helpText?: string;
  options?: { value: string; label: string }[];
}

export interface ContentSummary {
  totalDocuments: number;
  categories: { name: string; count: number }[];
  lastUpdated: Date;
  sampleTitles: string[];
}

export interface SyncResult {
  repositoryId: string;
  status: 'success' | 'error';
  documentsProcessed: number;
  documentsAdded: number;
  documentsUpdated: number;
  documentsRemoved: number;
  errors: string[];
  duration: number; // in milliseconds
}

export interface RepositoryDocument {
  id: string;
  repositoryId: string;
  title: string;
  content: string;
  cleanContent: string;
  url: string;
  category: string;
  keywords: string[];
  lastModified: Date;
  version?: string;
  metadata: Record<string, any>;
}