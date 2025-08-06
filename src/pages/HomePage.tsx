import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Users, Code, Rocket, Star, GitBranch, Eye } from 'lucide-react'
import { appsData } from '../data/apps'

const HomePage: React.FC = () => {
  const featuredApps = appsData.filter(app => app.featured)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-300/20 rounded-full animate-bounce-gentle" />
        <div className="absolute top-40 right-16 w-16 h-16 bg-blue-300/20 rounded-full animate-bounce-gentle delay-1000" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-300/20 rounded-full animate-bounce-gentle delay-500" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full glass-card mb-8">
            <Zap className="h-5 w-5 text-accent-500 mr-2" />
            <span className="text-sm font-medium text-slate-700">50+ Open Source AI Applications</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Discover Amazing{' '}
            <span className="gradient-text">LLM Applications</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Explore, learn, and deploy cutting-edge AI agents, RAG systems, and multimodal applications. 
            Built with the latest AI models and frameworks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/apps" className="btn-primary text-lg px-8 py-4">
              Explore All Apps
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="https://github.com/Shubhamsaboo/awesome-llm-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-8 py-4"
            >
              <Star className="mr-2 h-5 w-5" />
              Star on GitHub
            </a>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-slate-600">AI Applications</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-accent-600 mb-2">8</div>
              <div className="text-slate-600">Categories</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-slate-600">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Apps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Applications</h2>
            <p className="text-xl text-slate-600">Handpicked AI applications that showcase the power of modern LLMs</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredApps.map((app) => (
              <div key={app.id} className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-600">
                      <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm font-medium opacity-75">{app.category}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {app.category}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      app.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                      app.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary-600 transition-colors duration-200">
                    {app.title}
                  </h3>
                  
                  <p className="text-slate-600 mb-6 line-clamp-3">
                    {app.description}
                  </p>
                  
                  {app.agents && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        AI Agents ({app.agents.length})
                      </h4>
                      <div className="space-y-2">
                        {app.agents.slice(0, 2).map((agent, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-sm text-slate-700">{agent.name}</span>
                              <p className="text-xs text-slate-500">{agent.description}</p>
                            </div>
                          </div>
                        ))}
                        {app.agents.length > 2 && (
                          <div className="text-xs text-slate-500 ml-4">
                            +{app.agents.length - 2} more agents
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span className="flex items-center">
                        <GitBranch className="h-4 w-4 mr-1" />
                        {app.estimatedTime}
                      </span>
                      <span>{app.author.split(' ')[0]}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <a
                        href={app.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors duration-200"
                      >
                        <Code className="h-4 w-4 mr-1" />
                        Code
                      </a>
                      <Link
                        to={`/app/${app.id}`}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/apps" className="btn-primary">
              View All Apps
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore by Category</h2>
          <p className="text-xl text-slate-600 mb-12">Find the perfect AI application for your needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Multi-Agent Systems', icon: Users, count: 8, color: 'from-blue-500 to-cyan-500' },
              { name: 'RAG Systems', icon: Code, count: 12, color: 'from-green-500 to-emerald-500' },
              { name: 'Voice AI', icon: Zap, count: 6, color: 'from-purple-500 to-pink-500' },
              { name: 'Data Analysis', icon: Rocket, count: 10, color: 'from-orange-500 to-red-500' }
            ].map((category) => (
              <Link
                key={category.name}
                to="/apps"
                className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {category.name}
                </h3>
                <p className="text-sm text-slate-500">{category.count} applications</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Amazing AI Apps?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers building the future with LLM applications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apps" className="bg-white text-primary-600 hover:bg-gray-100 font-medium px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg">
              Start Exploring
            </Link>
            <a
              href="https://github.com/Shubhamsaboo/awesome-llm-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium px-8 py-4 rounded-xl transition-colors duration-200"
            >
              Contribute on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage