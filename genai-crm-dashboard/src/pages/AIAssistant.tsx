import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Bot,
  MessageSquare,
  Target,
  Clock,
  ThumbsUp,
  ThumbsDown,
  CheckSquare,
  MessageCircle,
  Activity,
  FileText,
  User,
  Sparkles,
  ExternalLink,
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput'
import { FloatingLabelTextarea } from '@/components/ui/FloatingLabelTextarea'
import { ConfluenceMCPManager } from '@/services/confluence'
import type { EnhancedAIResponse, CustomerQuery } from '@/services/confluence'
import toast from 'react-hot-toast'

interface QueryForm {
  ticketId: string
  customerId?: string
  customerVoice: string
  agentContext: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface ConfluenceStats {
  total: number
  byCategory: Record<string, number>
  lastSync: Date | undefined
  freshness: {
    fresh: number
    stale: number
    outdated: number
  }
}

// Initialize Confluence MCP Manager
let confluenceManager: ConfluenceMCPManager | null = null

const initializeConfluenceManager = async () => {
  if (!confluenceManager) {
    const config = {
      baseUrl: process.env.REACT_APP_CONFLUENCE_BASE_URL || 'https://company.atlassian.net',
      username: process.env.REACT_APP_CONFLUENCE_USERNAME || '',
      apiToken: process.env.REACT_APP_CONFLUENCE_API_TOKEN || '',
      spaceKey: process.env.REACT_APP_CONFLUENCE_CS_SPACE_KEY || 'CS'
    }
    
    confluenceManager = new ConfluenceMCPManager(config, process.env.REACT_APP_ANTHROPIC_API_KEY)
    
    try {
      await confluenceManager.initialize()
      console.log('✅ Confluence MCP Manager initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Confluence MCP Manager:', error)
      return false
    }
  }
  return true
}

export default function AIAssistant() {
  const [aiResponse, setAIResponse] = useState<EnhancedAIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<'accurate' | 'inaccurate' | null>(null)
  const [confluenceStats, setConfluenceStats] = useState<ConfluenceStats | null>(null)
  const [isConfluenceReady, setIsConfluenceReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<QueryForm>()

  // Initialize Confluence on component mount
  useEffect(() => {
    const init = async () => {
      const success = await initializeConfluenceManager()
      setIsConfluenceReady(success)
      
      if (success && confluenceManager) {
        const stats = confluenceManager.getSOPStatistics()
        setConfluenceStats(stats)
      }
    }
    
    init()
  }, [])

  const recentQueries = [
    {
      id: '1',
      ticketId: 'TKT-12345',
      summary: 'Refund request for damaged item',
      timestamp: '2 min ago',
      status: 'processed',
      sopUsed: 'Return Policy SOP'
    },
    {
      id: '2', 
      ticketId: 'TKT-12344',
      summary: 'Account access issues',
      timestamp: '5 min ago',
      status: 'processing',
      sopUsed: 'Account Recovery SOP'
    },
    {
      id: '3',
      ticketId: 'TKT-12343', 
      summary: 'Billing inquiry',
      timestamp: '8 min ago',
      status: 'completed',
      sopUsed: 'Billing Support SOP'
    }
  ]

  const quickActions = [
    { label: 'Refund Process', icon: Target, color: 'blue' as const, category: 'returns' },
    { label: 'Account Reset', icon: User, color: 'green' as const, category: 'account' },
    { label: 'Billing Query', icon: Activity, color: 'purple' as const, category: 'billing' },
    { label: 'Technical Support', icon: FileText, color: 'orange' as const, category: 'technical' },
  ]

  const onSubmit = async (data: QueryForm) => {
    if (!isConfluenceReady || !confluenceManager) {
      toast.error('Confluence integration not available. Using fallback AI.')
      return
    }

    setIsLoading(true)
    setAIResponse(null)
    
    try {
      const query: CustomerQuery = {
        voc: data.customerVoice,
        agentHelpText: data.agentContext,
        ticketId: data.ticketId,
        customerId: data.customerId,
        priority: data.priority
      }

      console.log('🔍 Processing query with Confluence SOPs:', query)
      const response = await confluenceManager.processCustomerQuery(query)
      
      setAIResponse(response)
      toast.success(`AI response generated with ${response.totalSOPsConsulted} SOPs consulted`)
    } catch (error) {
      console.error('❌ Error processing query:', error)
      toast.error('Failed to process query. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    if (!confluenceManager) return
    
    setSyncStatus('syncing')
    try {
      await confluenceManager.performIncrementalSync()
      const stats = confluenceManager.getSOPStatistics()
      setConfluenceStats(stats)
      setSyncStatus('idle')
      toast.success('SOPs synchronized successfully')
    } catch (error) {
      setSyncStatus('error')
      toast.error('Failed to sync SOPs')
    }
  }

  const handleQuickAction = (category: string) => {
    reset({
      ticketId: `TKT-${Date.now()}`,
      customerVoice: `Customer needs help with ${category}`,
      agentContext: `Quick action triggered for ${category}`,
      priority: 'medium'
    })
  }

  const handleFeedback = (type: 'accurate' | 'inaccurate') => {
    setFeedback(type)
    toast.success(`Feedback recorded: ${type}`)
  }

  const getStatusIcon = () => {
    if (!isConfluenceReady) return <XCircle className="w-4 h-4 text-red-500" />
    if (syncStatus === 'syncing') return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    if (syncStatus === 'error') return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusText = () => {
    if (!isConfluenceReady) return 'Confluence Disconnected'
    if (syncStatus === 'syncing') return 'Syncing SOPs...'
    if (syncStatus === 'error') return 'Sync Error'
    return 'Confluence Connected'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Assistant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered customer support with live Confluence SOPs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Confluence Status */}
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-full">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getStatusText()}
            </span>
            {isConfluenceReady && (
              <button
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          
          {/* AI Model Status */}
          <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Claude-3.5 + Confluence SOPs
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Today's Queries"
          value="47"
          change="+12%"
          icon={MessageSquare}
          color="blue"
        />
        <StatsCard
          title="SOPs Available"
          value={confluenceStats?.total?.toString() || '0'}
          change={confluenceStats ? `${confluenceStats.freshness.fresh} fresh` : 'Loading...'}
          icon={BookOpen}
          color="green"
        />
        <StatsCard
          title="Avg Response Time"
          value="1.2s"
          change="-0.3s"
          icon={Clock}
          color="purple"
        />
        <StatsCard
          title="Accuracy Rate"
          value="94.8%"
          change="+2.1%"
          icon={Target}
          color="orange"
        />
      </motion.div>

      {/* SOP Categories Overview */}
      {confluenceStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
            Available SOP Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(confluenceStats.byCategory).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{category}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Last sync: {confluenceStats.lastSync?.toLocaleString() || 'Never'}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Query Interface */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Bot className="w-6 h-6 mr-2 text-blue-500" />
            AI Assistant Query
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingLabelInput
                label="Ticket ID"
                {...register('ticketId', { required: 'Ticket ID is required' })}
                error={errors.ticketId?.message}
                placeholder="TKT-12345"
              />
              
              <FloatingLabelInput
                label="Customer ID (Optional)"
                {...register('customerId')}
                placeholder="CUST-67890"
              />
            </div>

            <div>
              <FloatingLabelTextarea
                label="Customer Voice (Issue Description)"
                {...register('customerVoice', { required: 'Customer voice is required' })}
                error={errors.customerVoice?.message}
                placeholder="Customer is requesting a refund for a damaged item they received yesterday..."
                rows={4}
              />
            </div>

            <div>
              <FloatingLabelTextarea
                label="Agent Context (Additional Notes)"
                {...register('agentContext')}
                placeholder="Customer seems frustrated, order was placed 3 days ago, item appears to be damaged in shipping..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority Level
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isConfluenceReady}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing with SOPs...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Get AI Assistance</span>
                </div>
              )}
            </motion.button>
          </form>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickAction(action.category)}
                  className={`p-4 bg-${action.color}-50 dark:bg-${action.color}-900/20 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30 rounded-lg transition-colors group`}
                >
                  <action.icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400 mx-auto mb-2`} />
                  <div className={`text-sm font-medium text-${action.color}-700 dark:text-${action.color}-300`}>
                    {action.label}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Queries Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            Recent Queries
          </h3>
          
          <div className="space-y-4">
            {recentQueries.map((query) => (
              <div key={query.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {query.ticketId}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    query.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : query.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {query.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{query.summary}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{query.timestamp}</span>
                  <span className="flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {query.sopUsed}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Response Display */}
      {aiResponse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
              AI Response
            </h3>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Target className="w-4 h-4" />
                <span>Confidence: {aiResponse.confidenceScore}%</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleFeedback('accurate')}
                  className={`p-2 rounded-lg transition-colors ${
                    feedback === 'accurate'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeedback('inaccurate')}
                  className={`p-2 rounded-lg transition-colors ${
                    feedback === 'inaccurate'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Process Steps */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
                Process Steps
              </h4>
              
              <div className="space-y-4">
                {aiResponse.processSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                        {step.action}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {step.reasoning}
                      </p>
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                        <BookOpen className="w-3 h-3 mr-1" />
                        <span>{step.sopReference}</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Suggested Response */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                Suggested Response
              </h4>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {aiResponse.suggestedResponse}
                </p>
              </div>

              {/* SOP Sources */}
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Referenced SOPs ({aiResponse.totalSOPsConsulted})
                </h5>
                <div className="space-y-2">
                  {aiResponse.sopSources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          v{source.version}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {(source.relevanceScore * 100).toFixed(0)}% match
                        </span>
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Classification:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      aiResponse.classification === 'sop_based'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : aiResponse.classification === 'new_scenario'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {aiResponse.classification}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">SOP Freshness:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      aiResponse.sopFreshness === 'fresh'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : aiResponse.sopFreshness === 'stale'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {aiResponse.sopFreshness}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}