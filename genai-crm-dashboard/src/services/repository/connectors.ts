import { RepositoryConnector } from '@/types/repository';

// Repository Connectors Registry
export const repositoryConnectors: RepositoryConnector[] = [
  {
    type: 'confluence',
    name: 'Confluence',
    description: 'Connect to Atlassian Confluence spaces for SOPs and documentation',
    icon: '🌊',
    color: 'blue',
    requiresAuth: true,
    authFields: [
      {
        key: 'baseUrl',
        label: 'Confluence URL',
        type: 'url',
        placeholder: 'https://yourcompany.atlassian.net',
        required: true,
        helpText: 'Your Confluence instance URL (without /wiki)'
      },
      {
        key: 'username',
        label: 'Username/Email',
        type: 'text',
        placeholder: 'your-email@company.com',
        required: true,
        helpText: 'Your Confluence account email'
      },
      {
        key: 'apiToken',
        label: 'API Token',
        type: 'password',
        placeholder: 'Enter your Confluence API token',
        required: true,
        helpText: 'Generate from Confluence Account Settings → Security → API Tokens'
      },
      {
        key: 'spaceKey',
        label: 'Space Key',
        type: 'text',
        placeholder: 'CS',
        required: true,
        helpText: 'The space key containing your customer support documentation'
      }
    ],
    settingsFields: [
      {
        key: 'syncInterval',
        label: 'Sync Interval (minutes)',
        type: 'number',
        defaultValue: 60,
        helpText: 'How often to check for updates'
      },
      {
        key: 'autoSync',
        label: 'Auto Sync',
        type: 'boolean',
        defaultValue: true,
        helpText: 'Automatically sync when changes are detected'
      }
    ],
    testConnection: async (credentials) => {
      // Test Confluence connection
      try {
        const response = await fetch(`${credentials.baseUrl}/rest/api/space/${credentials.spaceKey}`, {
          headers: {
            'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.apiToken}`)}`,
            'Accept': 'application/json'
          }
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    discoverContent: async (_config) => {
      // Mock discovery for demo
      return {
        totalDocuments: 45,
        categories: [
          { name: 'returns', count: 12 },
          { name: 'billing', count: 8 },
          { name: 'technical', count: 15 },
          { name: 'account', count: 10 }
        ],
        lastUpdated: new Date(),
        sampleTitles: [
          'Return Policy SOP',
          'Billing Dispute Resolution',
          'Technical Support Escalation',
          'Account Recovery Process'
        ]
      };
    }
  },
  {
    type: 'notion',
    name: 'Notion',
    description: 'Connect to Notion databases and pages for knowledge management',
    icon: '📝',
    color: 'gray',
    requiresAuth: true,
    authFields: [
      {
        key: 'apiToken',
        label: 'Integration Token',
        type: 'password',
        placeholder: 'secret_...',
        required: true,
        helpText: 'Create an integration in Notion and copy the token'
      },
      {
        key: 'databaseId',
        label: 'Database ID',
        type: 'text',
        placeholder: 'Enter Notion database ID',
        required: true,
        helpText: 'The ID of your knowledge base database'
      }
    ],
    settingsFields: [
      {
        key: 'syncInterval',
        label: 'Sync Interval (minutes)',
        type: 'number',
        defaultValue: 30,
        helpText: 'How often to check for updates'
      }
    ],
    testConnection: async (credentials) => {
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${credentials.databaseId}`, {
          headers: {
            'Authorization': `Bearer ${credentials.apiToken}`,
            'Notion-Version': '2022-06-28'
          }
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    discoverContent: async (_config) => {
      return {
        totalDocuments: 32,
        categories: [
          { name: 'support', count: 18 },
          { name: 'policies', count: 8 },
          { name: 'procedures', count: 6 }
        ],
        lastUpdated: new Date(),
        sampleTitles: [
          'Customer Support Guidelines',
          'Escalation Procedures',
          'FAQ Management'
        ]
      };
    }
  },
  {
    type: 'google-docs',
    name: 'Google Drive',
    description: 'Connect to Google Drive folders for document-based knowledge',
    icon: '📄',
    color: 'green',
    requiresAuth: true,
    authFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Your Google OAuth Client ID',
        required: true,
        helpText: 'From Google Cloud Console → APIs & Services → Credentials'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Your Google OAuth Client Secret',
        required: true,
        helpText: 'From Google Cloud Console → APIs & Services → Credentials'
      },
      {
        key: 'folderId',
        label: 'Folder ID',
        type: 'text',
        placeholder: 'Google Drive folder ID',
        required: true,
        helpText: 'The ID of the folder containing your documents'
      }
    ],
    settingsFields: [
      {
        key: 'syncInterval',
        label: 'Sync Interval (minutes)',
        type: 'number',
        defaultValue: 120,
        helpText: 'How often to check for updates'
      }
    ],
    testConnection: async (credentials) => {
      // Mock test for demo
      return !!(credentials.clientId && credentials.clientSecret && credentials.folderId);
    },
    discoverContent: async (_config) => {
      return {
        totalDocuments: 28,
        categories: [
          { name: 'policies', count: 12 },
          { name: 'procedures', count: 16 }
        ],
        lastUpdated: new Date(),
        sampleTitles: [
          'Employee Handbook',
          'Customer Service Policies',
          'Standard Operating Procedures'
        ]
      };
    }
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Connect to GitHub repositories for documentation and wikis',
    icon: '🐙',
    color: 'purple',
    requiresAuth: true,
    authFields: [
      {
        key: 'token',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'ghp_...',
        required: true,
        helpText: 'Generate from GitHub Settings → Developer settings → Personal access tokens'
      },
      {
        key: 'repoUrl',
        label: 'Repository URL',
        type: 'url',
        placeholder: 'https://github.com/owner/repo',
        required: true,
        helpText: 'The GitHub repository containing your documentation'
      }
    ],
    settingsFields: [
      {
        key: 'syncInterval',
        label: 'Sync Interval (minutes)',
        type: 'number',
        defaultValue: 180,
        helpText: 'How often to check for updates'
      },
      {
        key: 'includePaths',
        label: 'Include Paths',
        type: 'multiselect',
        defaultValue: ['docs/', 'wiki/', 'README.md'],
        helpText: 'Paths to include in sync'
      }
    ],
    testConnection: async (credentials) => {
      try {
        const repoPath = credentials.repoUrl.replace('https://github.com/', '');
        const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
          headers: {
            'Authorization': `token ${credentials.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    discoverContent: async (_config) => {
      return {
        totalDocuments: 15,
        categories: [
          { name: 'documentation', count: 10 },
          { name: 'wiki', count: 5 }
        ],
        lastUpdated: new Date(),
        sampleTitles: [
          'API Documentation',
          'Setup Guide',
          'Contributing Guidelines'
        ]
      };
    }
  },
  {
    type: 'sharepoint',
    name: 'SharePoint',
    description: 'Connect to Microsoft SharePoint sites and document libraries',
    icon: '🏢',
    color: 'indigo',
    requiresAuth: true,
    authFields: [
      {
        key: 'siteUrl',
        label: 'SharePoint Site URL',
        type: 'url',
        placeholder: 'https://yourcompany.sharepoint.com/sites/sitename',
        required: true,
        helpText: 'Your SharePoint site URL'
      },
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Azure App Client ID',
        required: true,
        helpText: 'From Azure App Registration'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Azure App Client Secret',
        required: true,
        helpText: 'From Azure App Registration'
      }
    ],
    settingsFields: [
      {
        key: 'syncInterval',
        label: 'Sync Interval (minutes)',
        type: 'number',
        defaultValue: 90,
        helpText: 'How often to check for updates'
      }
    ],
    testConnection: async (credentials) => {
      // Mock test for demo
      return !!(credentials.siteUrl && credentials.clientId && credentials.clientSecret);
    },
    discoverContent: async (_config) => {
      return {
        totalDocuments: 67,
        categories: [
          { name: 'policies', count: 23 },
          { name: 'procedures', count: 32 },
          { name: 'templates', count: 12 }
        ],
        lastUpdated: new Date(),
        sampleTitles: [
          'Corporate Policies',
          'HR Procedures',
          'IT Support Documentation'
        ]
      };
    }
  },
  {
    type: 'custom-api',
    name: 'Custom API',
    description: 'Connect to your own API or any REST endpoint for custom integrations',
    icon: '🔗',
    color: 'orange',
    requiresAuth: true,
    authFields: [
      {
        key: 'baseUrl',
        label: 'API Base URL',
        type: 'url',
        placeholder: 'https://api.yourcompany.com',
        required: true,
        helpText: 'The base URL of your API'
      },
      {
        key: 'authType',
        label: 'Authentication Type',
        type: 'select',
        required: true,
        options: [
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'apikey', label: 'API Key' }
        ],
        helpText: 'How to authenticate with your API'
      },
      {
        key: 'credentials',
        label: 'API Credentials',
        type: 'password',
        placeholder: 'Enter your API key or token',
        required: true,
        helpText: 'Your API authentication credentials'
      }
    ],
    settingsFields: [
      {
        key: 'documentsEndpoint',
        label: 'Documents Endpoint',
        type: 'text',
        defaultValue: '/documents',
        helpText: 'API endpoint to fetch documents'
      },
      {
        key: 'syncInterval',
        label: 'Sync Interval (minutes)',
        type: 'number',
        defaultValue: 60,
        helpText: 'How often to check for updates'
      }
    ],
    testConnection: async (credentials) => {
      try {
        const response = await fetch(`${credentials.baseUrl}/health`);
        return response.ok;
      } catch {
        return false;
      }
    },
    discoverContent: async (_config) => {
      return {
        totalDocuments: 0,
        categories: [],
        lastUpdated: new Date(),
        sampleTitles: []
      };
    }
  }
];

export const getConnectorByType = (type: string): RepositoryConnector | undefined => {
  return repositoryConnectors.find(connector => connector.type === type);
};

export const getConnectorIcon = (type: string): string => {
  const connector = getConnectorByType(type);
  return connector?.icon || '📁';
};

export const getConnectorColor = (type: string): string => {
  const connector = getConnectorByType(type);
  return connector?.color || 'gray';
};