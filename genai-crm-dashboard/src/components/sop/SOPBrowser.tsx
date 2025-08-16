import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import { api } from '@/services/api'
import { ConfluencePage } from '@/types'

interface SOPBrowserProps {
  onSelectSOP?: (sop: ConfluencePage) => void
  compact?: boolean
  searchQuery?: string
}

export default function SOPBrowser({ onSelectSOP, compact = false, searchQuery: initialQuery = '' }: SOPBrowserProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'browse'>('search')

  // Get Confluence spaces
  const { data: spacesData } = useQuery({
    queryKey: ['confluence-spaces'],
    queryFn: () => api.getConfluenceSpaces(),
  })

  // Search SOPs
  const { data: sopSearchData, isLoading: isSearchLoading, refetch: refetchSearch } = useQuery({
    queryKey: ['sop-search', searchQuery],
    queryFn: () => api.searchSOPs(searchQuery, 20),
    enabled: activeTab === 'search' && searchQuery.length > 2,
  })

  // Get recent pages
  const { data: recentPagesData, isLoading: isRecentLoading } = useQuery({
    queryKey: ['recent-confluence-pages', selectedSpace],
    queryFn: () => api.getRecentConfluencePages(selectedSpace || undefined, 30, 15),
    enabled: activeTab === 'recent',
  })

  // Browse pages by space
  const { data: spacePagesData, isLoading: isSpacePagesLoading } = useQuery({
    queryKey: ['confluence-space-pages', selectedSpace],
    queryFn: () => api.getConfluencePagesBySpace(selectedSpace, 25),
    enabled: activeTab === 'browse' && !!selectedSpace,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length > 2) {
      refetchSearch()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderSOPCard = (sop: ConfluencePage) => (
    <div
      key={sop.id}
      className={`card p-4 hover:shadow-medium transition-shadow duration-200 cursor-pointer ${
        compact ? 'mb-3' : 'mb-4'
      }`}
      onClick={() => onSelectSOP?.(sop)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <h3 className={`font-medium text-gray-900 dark:text-white truncate ${
              compact ? 'text-sm' : 'text-base'
            }`}>
              {sop.title}
            </h3>
          </div>
          
          {!compact && sop.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {sop.excerpt}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDate(sop.lastModified)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <BookOpenIcon className="h-4 w-4" />
              <span>{sop.spaceKey}</span>
            </div>
            
            {sop.labels.length > 0 && (
              <div className="flex items-center space-x-1">
                <TagIcon className="h-4 w-4" />
                <span>{sop.labels.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.open(sop.url, '_blank')
          }}
          className="ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Open in Confluence"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const currentData = activeTab === 'search' 
    ? sopSearchData?.data 
    : activeTab === 'recent' 
    ? recentPagesData?.data 
    : spacePagesData?.data

  const isLoading = activeTab === 'search' 
    ? isSearchLoading 
    : activeTab === 'recent' 
    ? isRecentLoading 
    : isSpacePagesLoading

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'}`}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            SOP Browser
          </h2>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['search', 'recent', 'browse'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SOPs and procedures..."
                className="input pl-10"
              />
            </div>
            <button
              type="submit"
              disabled={searchQuery.length < 3}
              className="btn-primary btn-md"
            >
              Search
            </button>
          </form>

          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="loading-spinner h-6 w-6" />
            </div>
          )}

          {currentData && (
            <div className="space-y-3">
              {currentData.length > 0 ? (
                currentData.map(renderSOPCard)
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No SOPs found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Tab */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="input flex-1"
            >
              <option value="">All Spaces</option>
              {spacesData?.data?.map((space) => (
                <option key={space.id} value={space.key}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="loading-spinner h-6 w-6" />
            </div>
          )}

          {currentData && (
            <div className="space-y-3">
              {currentData.length > 0 ? (
                currentData.map(renderSOPCard)
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent pages found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <select
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            className="input"
          >
            <option value="">Select a space</option>
            {spacesData?.data?.map((space) => (
              <option key={space.id} value={space.key}>
                {space.name}
              </option>
            ))}
          </select>

          {selectedSpace && isLoading && (
            <div className="flex justify-center py-8">
              <div className="loading-spinner h-6 w-6" />
            </div>
          )}

          {selectedSpace && currentData && (
            <div className="space-y-3">
              {currentData.length > 0 ? (
                currentData.map(renderSOPCard)
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No pages found in this space
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}