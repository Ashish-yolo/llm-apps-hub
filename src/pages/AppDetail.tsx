import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  ExternalLink, 
  Code, 
  Star, 
  Calendar, 
  Clock, 
  User, 
  Tags, 
  CheckCircle, 
  Users,
  Rocket,
  BookOpen,
  Target,
  Zap,
  GitBranch
} from 'lucide-react'
import { appsData } from '../data/apps'

const AppDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const app = appsData.find(app => app.id === id)

  if (!app) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">App Not Found</h1>
          <p className="text-slate-600 mb-8">The application you're looking for doesn't exist.</p>
          <Link to="/apps" className="btn-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Apps
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <Link to="/apps" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors duration-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Apps
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Title and Meta */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                    {app.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    app.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                    app.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {app.difficulty}
                  </span>
                  {app.featured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {app.title}
                </h1>

                <p className="text-xl text-slate-600 leading-relaxed mb-6">
                  {app.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {app.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(app.publishDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {app.estimatedTime}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <a
                  href={app.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <Code className="mr-2 h-4 w-4" />
                  View Code
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                {app.demoUrl && app.demoUrl !== '#' && (
                  <a
                    href={app.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Live Demo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}
                {app.tutorialUrl && (
                  <Link to={app.tutorialUrl} className="btn-secondary">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Tutorial
                  </Link>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-primary-600" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Difficulty</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      app.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                      app.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Category</span>
                    <span className="text-slate-800 font-medium">{app.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Time Needed</span>
                    <span className="text-slate-800 font-medium">{app.estimatedTime}</span>
                  </div>
                  {app.agents && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">AI Agents</span>
                      <span className="text-slate-800 font-medium">{app.agents.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <GitBranch className="h-5 w-5 mr-2 text-primary-600" />
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {app.techStack.map((tech, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-primary-600" />
                  Prerequisites
                </h3>
                <ul className="space-y-2">
                  {app.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* AI Agents (if applicable) */}
            {app.agents && (
              <div className="glass-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Users className="h-6 w-6 mr-3 text-primary-600" />
                  AI Agent Team ({app.agents.length})
                </h3>
                <div className="space-y-6">
                  {app.agents.map((agent, index) => (
                    <div key={index} className="border-l-4 border-primary-500 pl-6">
                      <h4 className="text-lg font-semibold text-slate-800 mb-2">{agent.name}</h4>
                      <div className="text-sm text-primary-600 font-medium mb-3">{agent.role}</div>
                      <p className="text-slate-600 leading-relaxed">{agent.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Rocket className="h-6 w-6 mr-3 text-primary-600" />
                Key Features
              </h3>
              <ul className="space-y-4">
                {app.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Use Cases */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Target className="h-6 w-6 mr-3 text-primary-600" />
                Use Cases
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {app.useCases.map((useCase, index) => (
                  <div key={index} className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                      <span className="font-medium text-slate-700">{useCase}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Tags className="h-6 w-6 mr-3 text-primary-600" />
                Tags & Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag, index) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-primary-100 hover:to-accent-100 text-slate-700 text-sm rounded-xl font-medium transition-all duration-200 cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Apps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">More in {app.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {appsData
              .filter(relatedApp => relatedApp.category === app.category && relatedApp.id !== app.id)
              .slice(0, 3)
              .map((relatedApp) => (
                <Link 
                  key={relatedApp.id} 
                  to={`/app/${relatedApp.id}`}
                  className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      {relatedApp.category}
                    </span>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      relatedApp.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                      relatedApp.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {relatedApp.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-3 group-hover:text-primary-600 transition-colors duration-200">
                    {relatedApp.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {relatedApp.description}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {relatedApp.estimatedTime}
                  </div>
                </Link>
              ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/apps" className="btn-primary">
              View All Apps
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AppDetail