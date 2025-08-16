import { RepositoryConfig, RepositoryConnector, SyncResult } from '@/types/repository';
import { repositoryConnectors, getConnectorByType } from './connectors';

export class RepositoryManager {
  private repositories: Map<string, RepositoryConfig> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadRepositories();
  }

  // Repository Management
  async addRepository(config: Omit<RepositoryConfig, 'id' | 'createdAt'>): Promise<string> {
    const id = this.generateId();
    const fullConfig: RepositoryConfig = {
      ...config,
      id,
      createdAt: new Date(),
      syncStatus: 'idle'
    };

    this.repositories.set(id, fullConfig);
    await this.saveRepositories();

    if (fullConfig.settings.autoSync) {
      this.setupAutoSync(fullConfig);
    }

    console.log(`✅ Repository "${fullConfig.name}" added successfully`);
    return id;
  }

  async updateRepository(id: string, updates: Partial<RepositoryConfig>): Promise<void> {
    const existing = this.repositories.get(id);
    if (!existing) {
      throw new Error(`Repository ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    this.repositories.set(id, updated);
    await this.saveRepositories();

    // Update auto-sync if settings changed
    if (updates.settings?.autoSync !== undefined) {
      this.clearAutoSync(id);
      if (updated.settings.autoSync && updated.isActive) {
        this.setupAutoSync(updated);
      }
    }
  }

  async removeRepository(id: string): Promise<void> {
    this.clearAutoSync(id);
    this.repositories.delete(id);
    await this.saveRepositories();
    console.log(`🗑️ Repository ${id} removed`);
  }

  getRepository(id: string): RepositoryConfig | undefined {
    return this.repositories.get(id);
  }

  getAllRepositories(): RepositoryConfig[] {
    return Array.from(this.repositories.values());
  }

  getActiveRepositories(): RepositoryConfig[] {
    return this.getAllRepositories().filter(repo => repo.isActive);
  }

  // Connection Testing
  async testConnection(repositoryId: string): Promise<boolean> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const connector = getConnectorByType(repository.type);
    if (!connector) {
      throw new Error(`Connector for type ${repository.type} not found`);
    }

    try {
      console.log(`🔌 Testing connection for ${repository.name}...`);
      const isConnected = await connector.testConnection(repository.credentials);
      
      await this.updateRepository(repositoryId, {
        syncStatus: isConnected ? 'success' : 'error'
      });

      console.log(`${isConnected ? '✅' : '❌'} Connection test ${isConnected ? 'passed' : 'failed'} for ${repository.name}`);
      return isConnected;
    } catch (error) {
      console.error(`❌ Connection test failed for ${repository.name}:`, error);
      await this.updateRepository(repositoryId, { syncStatus: 'error' });
      return false;
    }
  }

  // Content Discovery
  async discoverContent(repositoryId: string) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const connector = getConnectorByType(repository.type);
    if (!connector) {
      throw new Error(`Connector for type ${repository.type} not found`);
    }

    try {
      console.log(`🔍 Discovering content for ${repository.name}...`);
      const summary = await connector.discoverContent(repository);
      
      await this.updateRepository(repositoryId, {
        documentsCount: summary.totalDocuments,
        categoriesCount: summary.categories.length,
        lastSync: new Date(),
        syncStatus: 'success'
      });

      console.log(`✅ Content discovery complete for ${repository.name}: ${summary.totalDocuments} documents found`);
      return summary;
    } catch (error) {
      console.error(`❌ Content discovery failed for ${repository.name}:`, error);
      await this.updateRepository(repositoryId, { syncStatus: 'error' });
      throw error;
    }
  }

  // Synchronization
  async syncRepository(repositoryId: string): Promise<SyncResult> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const startTime = Date.now();
    await this.updateRepository(repositoryId, { syncStatus: 'syncing' });

    try {
      console.log(`🔄 Starting sync for ${repository.name}...`);
      
      // Test connection first
      const isConnected = await this.testConnection(repositoryId);
      if (!isConnected) {
        throw new Error('Connection test failed');
      }

      // Discover and sync content
      const summary = await this.discoverContent(repositoryId);
      
      const syncResult: SyncResult = {
        repositoryId,
        status: 'success',
        documentsProcessed: summary.totalDocuments,
        documentsAdded: summary.totalDocuments, // Simplified for demo
        documentsUpdated: 0,
        documentsRemoved: 0,
        errors: [],
        duration: Date.now() - startTime
      };

      await this.updateRepository(repositoryId, {
        syncStatus: 'success',
        lastSync: new Date()
      });

      console.log(`✅ Sync completed for ${repository.name} in ${syncResult.duration}ms`);
      return syncResult;
    } catch (error) {
      const syncResult: SyncResult = {
        repositoryId,
        status: 'error',
        documentsProcessed: 0,
        documentsAdded: 0,
        documentsUpdated: 0,
        documentsRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      };

      await this.updateRepository(repositoryId, { syncStatus: 'error' });
      console.error(`❌ Sync failed for ${repository.name}:`, error);
      return syncResult;
    }
  }

  async syncAllActiveRepositories(): Promise<SyncResult[]> {
    const activeRepos = this.getActiveRepositories();
    console.log(`🔄 Starting bulk sync for ${activeRepos.length} repositories...`);

    const results = await Promise.allSettled(
      activeRepos.map(repo => this.syncRepository(repo.id))
    );

    const syncResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          repositoryId: activeRepos[index].id,
          status: 'error' as const,
          documentsProcessed: 0,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsRemoved: 0,
          errors: [result.reason?.message || 'Unknown error'],
          duration: 0
        };
      }
    });

    const successCount = syncResults.filter(r => r.status === 'success').length;
    console.log(`✅ Bulk sync completed: ${successCount}/${activeRepos.length} repositories synced successfully`);

    return syncResults;
  }

  // Auto-sync Management
  private setupAutoSync(repository: RepositoryConfig): void {
    if (!repository.settings.autoSync || !repository.isActive) {
      return;
    }

    const intervalMs = repository.settings.syncInterval * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        await this.syncRepository(repository.id);
      } catch (error) {
        console.error(`Auto-sync failed for ${repository.name}:`, error);
      }
    }, intervalMs);

    this.syncIntervals.set(repository.id, interval);
    console.log(`⏰ Auto-sync enabled for ${repository.name} (every ${repository.settings.syncInterval} minutes)`);
  }

  private clearAutoSync(repositoryId: string): void {
    const interval = this.syncIntervals.get(repositoryId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(repositoryId);
    }
  }

  // Storage Management
  private async loadRepositories(): Promise<void> {
    try {
      const stored = localStorage.getItem('repositories');
      if (stored) {
        const repos: RepositoryConfig[] = JSON.parse(stored);
        repos.forEach(repo => {
          // Convert date strings back to Date objects
          repo.createdAt = new Date(repo.createdAt);
          if (repo.lastSync) {
            repo.lastSync = new Date(repo.lastSync);
          }
          this.repositories.set(repo.id, repo);
          
          // Setup auto-sync for active repositories
          if (repo.isActive && repo.settings.autoSync) {
            this.setupAutoSync(repo);
          }
        });
        console.log(`📂 Loaded ${repos.length} repositories from storage`);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  }

  private async saveRepositories(): Promise<void> {
    try {
      const repos = Array.from(this.repositories.values());
      localStorage.setItem('repositories', JSON.stringify(repos));
    } catch (error) {
      console.error('Error saving repositories:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility Methods
  getConnectors(): RepositoryConnector[] {
    return repositoryConnectors;
  }

  getRepositoryStats() {
    const repos = this.getAllRepositories();
    const active = repos.filter(r => r.isActive);
    const totalDocs = repos.reduce((sum, r) => sum + r.documentsCount, 0);
    
    const statusCounts = repos.reduce((acc, repo) => {
      acc[repo.syncStatus] = (acc[repo.syncStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: repos.length,
      active: active.length,
      totalDocuments: totalDocs,
      statusCounts,
      lastSync: repos.reduce((latest, repo) => {
        if (!repo.lastSync) return latest;
        return !latest || repo.lastSync > latest ? repo.lastSync : latest;
      }, null as Date | null)
    };
  }

  // Cleanup
  destroy(): void {
    // Clear all auto-sync intervals
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
  }
}

// Singleton instance
export const repositoryManager = new RepositoryManager();