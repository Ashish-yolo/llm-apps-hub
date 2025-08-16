import React, { useState, useEffect } from 'react';
import {
  Plus,
  Settings,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Trash2,
  Loader2
} from 'lucide-react';
import { RepositoryConfig } from '@/types/repository';
import { repositoryManager } from '@/services/repository/RepositoryManager';

const SimpleRepositorySettings: React.FC = () => {
  const [repositories, setRepositories] = useState<RepositoryConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalDocuments: 0,
    statusCounts: {} as Record<string, number>,
    lastSync: null as Date | null
  });

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = () => {
    const repos = repositoryManager.getAllRepositories();
    setRepositories(repos);
    setStats(repositoryManager.getRepositoryStats());
  };

  const handleAddRepository = () => {
    setShowModal(true);
  };

  const connectors = repositoryManager.getConnectors();

  const getStatusIcon = (status: RepositoryConfig['syncStatus']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: RepositoryConfig['syncStatus']) => {
    switch (status) {
      case 'success':
        return 'Connected';
      case 'error':
        return 'Error';
      case 'syncing':
        return 'Syncing...';
      default:
        return 'Idle';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repository Settings</h1>
          <p className="text-gray-600 mt-1">
            Connect and manage your knowledge repositories to power AI responses
          </p>
        </div>
        <button
          onClick={handleAddRepository}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Repository</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Repositories</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              <div className="text-sm text-gray-600">Active Repositories</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalDocuments.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.lastSync ? (
                  new Date(stats.lastSync).toLocaleDateString()
                ) : (
                  'Never'
                )}
              </div>
              <div className="text-sm text-gray-600">Last Sync</div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      {repositories.length === 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Getting Started</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Connect your knowledge repositories to provide AI responses with company-specific information 
              instead of generic answers. Here's what you can connect:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {connectors.map(connector => (
                <div key={connector.type} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{connector.icon}</span>
                    <div>
                      <div className="font-semibold">{connector.name}</div>
                      <div className="text-sm text-gray-600">{connector.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Ensure you have the necessary permissions and API keys 
                    for the repositories you want to connect. All credentials are stored securely in your browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repository List */}
      {repositories.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Repositories</h3>
            <div className="space-y-4">
              {repositories.map(repository => (
                <div key={repository.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{connectors.find(c => c.type === repository.type)?.icon || '📁'}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{repository.name}</h4>
                          {!repository.isActive && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize">
                            {repository.type.replace('-', ' ')}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(repository.syncStatus)}
                            <span className="text-sm text-gray-600">
                              {getStatusText(repository.syncStatus)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-gray-900 rounded">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-900 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {repository.documentsCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {repository.categoriesCount}
                      </div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {repository.settings.syncInterval}m
                      </div>
                      <div className="text-sm text-gray-600">Sync Interval</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simple Modal Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Repository</h3>
            <p className="text-gray-600 mb-4">
              Repository configuration modal will be implemented here.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleRepositorySettings;