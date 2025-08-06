export interface AppData {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  featured: boolean
  githubUrl: string
  demoUrl?: string
  tutorialUrl?: string
  author: string
  publishDate: string
  estimatedTime: string
  prerequisites: string[]
  techStack: string[]
  agents?: {
    name: string
    role: string
    description: string
  }[]
  features: string[]
  useCases: string[]
  image: string
}

export const appsData: AppData[] = [
  {
    id: 'ai-real-estate-team',
    title: 'AI Real Estate Agent Team',
    description: '3 AI agents work together to find your perfect home in minutes. Property Search Agent scrapes listings, Market Analysis Agent provides insights, and Property Valuation Agent evaluates investments.',
    category: 'Multi-Agent Systems',
    tags: ['Real Estate', 'Property Search', 'Investment Analysis', 'Multi-Agent', 'Firecrawl'],
    difficulty: 'Intermediate',
    featured: true,
    githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_ai_agents/multi_agent_apps/agent_teams/ai_real_estate_agent_team',
    demoUrl: '#',
    tutorialUrl: '/tutorial/ai-real-estate-team',
    author: 'Shubham Saboo & Gargi Gupta',
    publishDate: '2025-08-05',
    estimatedTime: '30 minutes',
    prerequisites: ['Python 3.10+', 'Basic AI knowledge', 'API keys setup'],
    techStack: ['Python', 'Agno Framework', 'OpenAI GPT-OSS', 'Firecrawl', 'Streamlit'],
    agents: [
      {
        name: 'Property Search Agent',
        role: 'Data Collection',
        description: 'Scrapes listings from Zillow, Realtor.com, and Trulia using Firecrawl'
      },
      {
        name: 'Market Analysis Agent',
        role: 'Market Intelligence',
        description: 'Processes properties for market insights and trend analysis'
      },
      {
        name: 'Property Valuation Agent',
        role: 'Investment Analysis',
        description: 'Evaluates properties and provides investment recommendations'
      }
    ],
    features: [
      'Multi-platform property search',
      'Real-time market analysis',
      'Investment potential scoring',
      'Neighborhood insights',
      'Price trend analysis',
      'Local and cloud deployment options'
    ],
    useCases: [
      'First-time home buyers',
      'Real estate investors',
      'Market researchers',
      'Property analysts'
    ],
    image: '/images/real-estate-team.jpg'
  },
  {
    id: 'multimodal-ai-agent',
    title: 'Multimodal AI Agent with Gemini 2.0',
    description: 'Advanced multimodal AI agent using Gemini 2.0 Flash that can process text, images, audio, and video inputs simultaneously.',
    category: 'Single Agent',
    tags: ['Multimodal', 'Gemini 2.0', 'Vision', 'Audio', 'Video'],
    difficulty: 'Advanced',
    featured: true,
    githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/starter_ai_agents/multimodal_ai_agent',
    demoUrl: '#',
    tutorialUrl: '/tutorial/multimodal-ai-agent',
    author: 'Shubham Saboo',
    publishDate: '2025-08-01',
    estimatedTime: '25 minutes',
    prerequisites: ['Google AI API key', 'Python 3.9+', 'Basic ML knowledge'],
    techStack: ['Python', 'Google Gemini 2.0', 'Phidata', 'Streamlit'],
    features: [
      'Multi-format input processing',
      'Real-time analysis',
      'Cross-modal understanding',
      'Interactive UI',
      'Batch processing support'
    ],
    useCases: [
      'Content analysis',
      'Educational tools',
      'Media processing',
      'Research applications'
    ],
    image: '/images/multimodal-agent.jpg'
  },
  {
    id: 'ai-data-analyst',
    title: 'AI Data Analysis Agent',
    description: 'Intelligent data analysis agent using GPT-4o that can analyze datasets, generate insights, create visualizations, and provide actionable recommendations.',
    category: 'Single Agent',
    tags: ['Data Analysis', 'GPT-4o', 'Visualization', 'Analytics', 'Business Intelligence'],
    difficulty: 'Beginner',
    featured: false,
    githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/starter_ai_agents/ai_data_analysis_agent',
    demoUrl: '#',
    tutorialUrl: '/tutorial/ai-data-analyst',
    author: 'Shubham Saboo',
    publishDate: '2025-07-28',
    estimatedTime: '20 minutes',
    prerequisites: ['OpenAI API key', 'Python 3.8+', 'Basic statistics knowledge'],
    techStack: ['Python', 'OpenAI GPT-4o', 'Pandas', 'Plotly', 'Streamlit'],
    features: [
      'Automated data analysis',
      'Interactive visualizations',
      'Statistical insights',
      'Report generation',
      'Export capabilities'
    ],
    useCases: [
      'Business analytics',
      'Research data analysis',
      'Financial reporting',
      'Marketing insights'
    ],
    image: '/images/data-analyst.jpg'
  },
  {
    id: 'voice-rag-agent',
    title: 'Voice-Enabled RAG Agent',
    description: 'Revolutionary RAG system with voice interaction capabilities. Ask questions using your voice and get intelligent responses with document retrieval.',
    category: 'Voice AI',
    tags: ['Voice AI', 'RAG', 'Speech Recognition', 'Document Q&A', 'OpenAI'],
    difficulty: 'Intermediate',
    featured: false,
    githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/voice_ai_agents/voice_rag_openaisdk',
    demoUrl: '#',
    tutorialUrl: '/tutorial/voice-rag-agent',
    author: 'Shubham Saboo',
    publishDate: '2025-07-25',
    estimatedTime: '35 minutes',
    prerequisites: ['OpenAI API key', 'Microphone access', 'Python 3.9+'],
    techStack: ['Python', 'OpenAI', 'Whisper', 'ChromaDB', 'Streamlit'],
    features: [
      'Voice-to-text conversion',
      'Document embedding',
      'Semantic search',
      'Audio responses',
      'Multi-format support'
    ],
    useCases: [
      'Document Q&A systems',
      'Voice assistants',
      'Educational tools',
      'Accessibility applications'
    ],
    image: '/images/voice-rag.jpg'
  },
  {
    id: 'github-mcp-agent',
    title: 'GitHub MCP Agent',
    description: 'Model Context Protocol agent that integrates with GitHub to manage repositories, issues, pull requests, and code analysis directly through AI conversations.',
    category: 'MCP Agents',
    tags: ['MCP', 'GitHub', 'Code Analysis', 'Repository Management', 'DevOps'],
    difficulty: 'Advanced',
    featured: false,
    githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/mcp_ai_agents/github_mcp_agent',
    demoUrl: '#',
    tutorialUrl: '/tutorial/github-mcp-agent',
    author: 'Shubham Saboo',
    publishDate: '2025-07-20',
    estimatedTime: '40 minutes',
    prerequisites: ['GitHub API token', 'MCP knowledge', 'Python 3.10+'],
    techStack: ['Python', 'MCP', 'GitHub API', 'Claude', 'FastAPI'],
    features: [
      'Repository management',
      'Issue tracking',
      'Code review assistance',
      'PR automation',
      'Workflow integration'
    ],
    useCases: [
      'DevOps automation',
      'Code review assistance',
      'Project management',
      'Development workflows'
    ],
    image: '/images/github-mcp.jpg'
  },
  {
    id: 'agentic-rag',
    title: 'Agentic RAG System',
    description: 'Next-generation RAG system with autonomous reasoning capabilities. The agent decides when to retrieve, what to search for, and how to synthesize information.',
    category: 'RAG Systems',
    tags: ['Agentic RAG', 'Autonomous AI', 'Document Retrieval', 'Reasoning', 'LangChain'],
    difficulty: 'Advanced',
    featured: true,
    githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/rag_tutorials/agentic_rag',
    demoUrl: '#',
    tutorialUrl: '/tutorial/agentic-rag',
    author: 'Shubham Saboo',
    publishDate: '2025-07-15',
    estimatedTime: '45 minutes',
    prerequisites: ['OpenAI API key', 'Advanced RAG knowledge', 'Python 3.9+'],
    techStack: ['Python', 'LangChain', 'OpenAI', 'Pinecone', 'FastAPI'],
    features: [
      'Autonomous retrieval decisions',
      'Multi-step reasoning',
      'Dynamic query expansion',
      'Context-aware responses',
      'Self-improving accuracy'
    ],
    useCases: [
      'Complex document analysis',
      'Research assistance',
      'Legal document review',
      'Technical documentation'
    ],
    image: '/images/agentic-rag.jpg'
  }
]

export const categories = [
  'All',
  'Multi-Agent Systems',
  'Single Agent',
  'Voice AI',
  'MCP Agents',
  'RAG Systems',
  'Data Analysis',
  'Computer Vision'
]

export const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']