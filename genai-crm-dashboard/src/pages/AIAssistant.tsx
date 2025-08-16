import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Bot,
  MessageSquare,
  Target,
  Clock,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  CheckSquare,
  MessageCircle,
  Activity,
  FileText,
  User,
  Sparkles,
} from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput'
import { FloatingLabelTextarea } from '@/components/ui/FloatingLabelTextarea'

interface QueryForm {
  ticketId: string
  transactionId?: string
  customerVoice: string
  agentContext: string
}

interface AIResponse {
  processSteps: Array<{
    action: string
    description: string
  }>
  suggestedResponse: string
  confidence: number
  sopReference?: string
}

export default function AIAssistant() {
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<'accurate' | 'inaccurate' | null>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<QueryForm>()

  const recentQueries = [
    {
      id: '1',
      ticketId: 'TKT-12345',
      summary: 'Refund request for damaged item',
      timestamp: '2 min ago',
      status: 'processed'
    },
    {
      id: '2', 
      ticketId: 'TKT-12344',
      summary: 'Account access issues',
      timestamp: '5 min ago',
      status: 'processing'
    },
    {
      id: '3',
      ticketId: 'TKT-12343', 
      summary: 'Billing inquiry',
      timestamp: '8 min ago',
      status: 'completed'
    }
  ]

  const quickActions = [
    { label: 'Refund Process', icon: Target, color: 'blue' as const },
    { label: 'Account Reset', icon: User, color: 'green' as const },
    { label: 'Billing Query', icon: Activity, color: 'purple' as const },
    { label: 'Technical Support', icon: FileText, color: 'orange' as const },
  ]

  const processSteps = [
    {
      action: 'Verify Customer Identity',
      description: 'Confirm account ownership using security questions or verification methods'
    },
    {
      action: 'Check Order Status',
      description: 'Review order history and current status in the system'
    },
    {
      action: 'Process Refund',
      description: 'Initiate refund through standard refund workflow (SOP-REF-001)'
    },
    {
      action: 'Send Confirmation',
      description: 'Email customer with refund confirmation and timeline'
    }
  ]

  const onSubmit = async () => {
    setIsLoading(true)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setAIResponse({
      processSteps,
      suggestedResponse: "I understand you'd like to return this item. Let me help you with that process. I can see your order here and it's eligible for our 30-day return policy. I'll initiate the refund for you right away. You should see the credit back to your original payment method within 3-5 business days. Is there anything else I can help you with regarding this return?",
      confidence: 94.8,
      sopReference: 'SOP-REF-001'
    })
    
    setIsLoading(false)
  }

  const handleFeedback = (type: 'accurate' | 'inaccurate') => {
    setFeedback(type)
    // Here you would send feedback to your analytics system
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
            Get AI-powered suggestions and assistance for customer interactions
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            AI Model: Claude-3.5 Sonnet
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Queries"
          value="47"
          change="+12%"
          icon={MessageSquare}
          color="blue"
        />
        <StatsCard
          title="Accuracy Rate"
          value="94.2%"
          change="+2.1%"
          icon={Target}
          color="green"
        />
        <StatsCard
          title="Avg Response Time"
          value="1.8s"
          change="-0.3s"
          icon={Clock}
          color="purple"
        />
        <StatsCard
          title="FCR Improvement"
          value="28%"
          change="+5%"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Input Panel */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Query Processor
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Provide context about the customer interaction
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput
                  label="Ticket ID"
                  {...register('ticketId', { required: 'Ticket ID is required' })}
                  error={errors.ticketId?.message}
                  placeholder="TKT-12345"
                />
                <FloatingLabelInput
                  label="Transaction ID (Optional)"
                  {...register('transactionId')}
                  placeholder="TXN-67890"
                />
              </div>
              
              <FloatingLabelTextarea
                label="Customer Voice (VOC)"
                {...register('customerVoice', { required: 'Customer voice is required' })}
                error={errors.customerVoice?.message}
                rows={3}
                placeholder="What is the customer saying or asking about?"
              />
              
              <FloatingLabelTextarea
                label="Agent Context"
                {...register('agentContext', { required: 'Agent context is required' })}
                error={errors.agentContext?.message}
                rows={3}
                placeholder="Additional context or notes about the situation"
              />
              
              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    <span>Get AI Assistance</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Queries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Recent Queries
            </h3>
            <div className="space-y-3">
              {recentQueries.map((query) => (
                <div key={query.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {query.ticketId}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      query.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      query.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {query.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {query.summary}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {query.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    action.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    action.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                    action.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                    'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <action.icon className={`w-4 h-4 ${
                      action.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      action.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      action.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Response Display */}
      {aiResponse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Bot className="w-6 h-6 mr-3 text-blue-500" />
              AI Recommendation
            </h2>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                {aiResponse.confidence}% Confidence
              </div>
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium">
                SOP-Based
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Process Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
                Process Steps
              </h3>
              <div className="space-y-3">
                {aiResponse.processSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {step.action}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Suggested Response */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                Suggested Customer Response
              </h3>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-gray-900 dark:text-white leading-relaxed">
                  {aiResponse.suggestedResponse}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFeedback('accurate')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    feedback === 'accurate' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Accurate</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFeedback('inaccurate')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    feedback === 'inaccurate' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Inaccurate</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}