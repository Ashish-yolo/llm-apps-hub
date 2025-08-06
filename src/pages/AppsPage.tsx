import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Code, GitBranch, Eye, Users, Star } from 'lucide-react'
import { appsData, categories, difficulties, type AppData } from '../data/apps'

const AppsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [sortBy, setSortBy] = useState('featured') // featured, newest, title

  const filteredAndSortedApps = useMemo(() => {
    let filtered = appsData.filter(app => {
      const matchesSearch = app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          app.author.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === 'All' || app.difficulty === selectedDifficulty

      return matchesSearch && matchesCategory && matchesDifficulty
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        case 'newest':
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [searchTerm, selectedCategory, selectedDifficulty, sortBy])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All')
    setSelectedDifficulty('All')
    setSortBy('featured')
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI <span className="gradient-text">Applications</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Discover {appsData.length} cutting-edge LLM applications across multiple categories. 
              From single agents to complex multi-agent systems.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search apps, technologies, authors..."
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <select
                  className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort and Clear Filters */}
            <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-600">Sort by:</span>
                <select
                  className="px-3 py-1 bg-white/50 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured First</option>
                  <option value="newest">Newest</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600">
                  {filteredAndSortedApps.length} of {appsData.length} apps
                </span>
                {(searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredAndSortedApps.length === 0 ? (
            <div className="text-center py-16">
              <div className="glass-card rounded-2xl p-12 inline-block">
                <Filter className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No apps found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search criteria</p>
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const AppCard: React.FC<{ app: AppData }> = ({ app }) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Featured Badge */}
      {app.featured && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </span>
        </div>
      )}

      {/* Image/Placeholder */}
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium opacity-75">{app.category}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category and Difficulty */}
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

        {/* Title */}
        <h3 className="text-xl font-bold mb-3 group-hover:text-primary-600 transition-colors duration-200">
          {app.title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 mb-4 text-sm leading-relaxed line-clamp-3">
          {app.description}
        </p>

        {/* Agents (if applicable) */}
        {app.agents && (
          <div className="mb-4">
            <div className="flex items-center text-xs text-slate-500 mb-2">
              <Users className="h-3 w-3 mr-1" />
              {app.agents.length} AI Agents
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              {app.agents.slice(0, 2).map((agent, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                  <span className="font-medium">{agent.name}</span>
                </div>
              ))}
              {app.agents.length > 2 && (
                <div className="text-slate-400 ml-3.5">+{app.agents.length - 2} more</div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {app.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
              {tag}
            </span>
          ))}
          {app.tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
              +{app.tags.length - 3}
            </span>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <GitBranch className="h-4 w-4 mr-1" />
              {app.estimatedTime}
            </span>
          </div>
          <span>{app.author.split(' ')[0]}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <a
            href={app.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 border border-slate-200 hover:border-primary-200 rounded-lg transition-colors duration-200"
          >
            <Code className="h-4 w-4 mr-1" />
            Code
          </a>
          <Link
            to={`/app/${app.id}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AppsPage