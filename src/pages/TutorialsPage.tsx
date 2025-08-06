import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, User, ArrowRight, Code, FileText, ExternalLink } from 'lucide-react'

const TutorialsPage: React.FC = () => {
  const tutorials = [
    {
      id: 'ai-real-estate-team',
      title: 'Build an AI Real Estate Agent Team',
      description: 'Learn how to create a multi-agent system with 3 AI agents that work together to find properties, analyze markets, and evaluate investments.',
      category: 'Multi-Agent Systems',
      difficulty: 'Intermediate',
      duration: '45 minutes',
      author: 'Shubham Saboo',
      steps: 8,
      type: 'Step-by-step',
      featured: true,
      topics: ['Agno Framework', 'OpenAI GPT-OSS', 'Firecrawl', 'Multi-agent coordination'],
      githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_ai_agents/multi_agent_apps/agent_teams/ai_real_estate_agent_team'
    },
    {
      id: 'voice-rag-system',
      title: 'Voice-Enabled RAG System',
      description: 'Build a RAG system that accepts voice input, processes documents, and responds with synthesized speech.',
      category: 'Voice AI',
      difficulty: 'Intermediate',
      duration: '35 minutes',
      author: 'Shubham Saboo',
      steps: 6,
      type: 'Hands-on',
      featured: true,
      topics: ['OpenAI Whisper', 'Document embeddings', 'Text-to-speech', 'Streamlit'],
      githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/voice_ai_agents/voice_rag_openaisdk'
    },
    {
      id: 'agentic-rag',
      title: 'Agentic RAG Implementation',
      description: 'Advanced tutorial on building autonomous RAG systems that can reason about when and what to retrieve.',
      category: 'RAG Systems',
      difficulty: 'Advanced',
      duration: '60 minutes',
      author: 'Shubham Saboo',
      steps: 10,
      type: 'Deep Dive',
      featured: true,
      topics: ['LangChain', 'Autonomous reasoning', 'Query planning', 'Retrieval optimization'],
      githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/rag_tutorials/agentic_rag'
    },
    {
      id: 'multimodal-ai',
      title: 'Multimodal AI with Gemini 2.0',
      description: 'Create AI agents that can process text, images, audio, and video simultaneously using Google\'s latest model.',
      category: 'Single Agent',
      difficulty: 'Advanced',
      duration: '40 minutes',
      author: 'Shubham Saboo',
      steps: 7,
      type: 'Project-based',
      featured: false,
      topics: ['Gemini 2.0 Flash', 'Multimodal processing', 'Phidata', 'Media analysis'],
      githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/starter_ai_agents/multimodal_ai_agent'
    },
    {
      id: 'github-mcp-agent',
      title: 'GitHub MCP Agent',
      description: 'Build an MCP agent that can manage GitHub repositories, issues, and pull requests through AI conversations.',
      category: 'MCP Agents',
      difficulty: 'Advanced',
      duration: '50 minutes',
      author: 'Shubham Saboo',
      steps: 9,
      type: 'Integration',
      featured: false,
      topics: ['Model Context Protocol', 'GitHub API', 'Repository management', 'FastAPI'],
      githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/mcp_ai_agents/github_mcp_agent'
    },
    {
      id: 'data-analysis-agent',
      title: 'AI Data Analysis Agent',
      description: 'Create an intelligent data analyst that can examine datasets, generate insights, and create visualizations.',
      category: 'Single Agent',
      difficulty: 'Beginner',
      duration: '25 minutes',
      author: 'Shubham Saboo',
      steps: 5,
      type: 'Beginner-friendly',
      featured: false,
      topics: ['GPT-4o', 'Pandas', 'Plotly', 'Data visualization', 'Statistical analysis'],
      githubUrl: 'https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/starter_ai_agents/ai_data_analysis_agent'
    }
  ]

  const categories = ['All', 'Multi-Agent Systems', 'Single Agent', 'Voice AI', 'RAG Systems', 'MCP Agents']
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

  const [selectedCategory, setSelectedCategory] = React.useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('All')

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'All' || tutorial.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'All' || tutorial.difficulty === selectedDifficulty
    return matchesCategory && matchesDifficulty
  })

  const featuredTutorials = tutorials.filter(tutorial => tutorial.featured)

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full glass-card mb-8">
            <BookOpen className="h-5 w-5 text-accent-500 mr-2" />
            <span className="text-sm font-medium text-slate-700">Step-by-step Learning</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Learn to Build <span className="gradient-text">AI Applications</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12">
            Comprehensive tutorials and guides to help you master AI agent development, 
            from beginner-friendly projects to advanced multi-agent systems.
          </p>
        </div>
      </section>

      {/* Featured Tutorials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Tutorials</h2>
            <p className="text-xl text-slate-600">Our most popular and comprehensive learning resources</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredTutorials.map((tutorial) => (
              <div key={tutorial.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {tutorial.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tutorial.difficulty === 'Beginner' ? 'bg-green-400/20' :
                      tutorial.difficulty === 'Intermediate' ? 'bg-yellow-400/20' :
                      'bg-red-400/20'
                    }`}>
                      {tutorial.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tutorial.title}</h3>
                  <p className="text-white/90 text-sm">{tutorial.description}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {tutorial.duration}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {tutorial.steps} steps
                    </div>
                  </div>

                  <div className="flex items-center mb-4 text-sm text-slate-500">
                    <User className="h-4 w-4 mr-1" />
                    {tutorial.author}
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">You'll learn:</div>
                    <div className="flex flex-wrap gap-1">
                      {tutorial.topics.slice(0, 2).map((topic, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                          {topic}
                        </span>
                      ))}
                      {tutorial.topics.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                          +{tutorial.topics.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={tutorial.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 border border-slate-200 hover:border-primary-200 rounded-lg transition-colors duration-200"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Code
                    </a>
                    <Link
                      to={`/app/${tutorial.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      Start Tutorial
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Tutorials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">All Tutorials</h2>
            <p className="text-xl text-slate-600">Choose your learning path based on your interests and skill level</p>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <select
                  className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tutorials List */}
          <div className="space-y-6">
            {filteredTutorials.map((tutorial) => (
              <div key={tutorial.id} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  <div className="lg:col-span-3">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {tutorial.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                        tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tutorial.difficulty}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                        {tutorial.type}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 hover:text-primary-600 transition-colors duration-200">
                      {tutorial.title}
                    </h3>

                    <p className="text-slate-600 mb-4 leading-relaxed">
                      {tutorial.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {tutorial.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutorial.duration}
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {tutorial.steps} steps
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <a
                      href={tutorial.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 border border-slate-200 hover:border-primary-200 rounded-lg transition-colors duration-200"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      View Code
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                    <Link
                      to={`/app/${tutorial.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      Start Tutorial
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <div className="glass-card rounded-2xl p-8 inline-block">
                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No tutorials found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All')
                    setSelectedDifficulty('All')
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers building amazing AI applications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apps" className="bg-white text-primary-600 hover:bg-gray-100 font-medium px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg">
              Browse All Apps
            </Link>
            <a
              href="https://github.com/Shubhamsaboo/awesome-llm-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium px-8 py-4 rounded-xl transition-colors duration-200"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TutorialsPage