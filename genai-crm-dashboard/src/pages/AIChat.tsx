import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Send,
  User,
  Bot,
  X,
  FileText,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import { api } from '@/services/api'
import { ConversationTurn, ConfluencePage } from '@/types'
import SOPBrowser from '@/components/sop/SOPBrowser'

interface Message extends ConversationTurn {
  suggestions?: Array<{
    type: 'direct' | 'detailed' | 'empathetic'
    text: string
    confidence: number
  }>
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showSOPBrowser, setShowSOPBrowser] = useState(false)
  const [sopSuggestions, setSOPSuggestions] = useState<ConfluencePage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Get customers for selection
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(1, 50),
  })

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: ({ customerId, initialMessage }: { customerId: string; initialMessage?: string }) =>
      api.startConversation(customerId, initialMessage),
    onSuccess: (data) => {
      setConversationId(data.data?.conversation_id || null)
    },
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ query, customerId }: { query: string; customerId?: string }) =>
      api.processAIQuery({ query, customer_id: customerId }),
    onSuccess: (data, variables) => {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: variables.query,
        timestamp: new Date().toISOString(),
      }

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.response || 'No response',
        timestamp: new Date().toISOString(),
        suggestions: data.data?.suggestions,
        metadata: {
          confidence_score: data.data?.confidence_score,
          processing_time_ms: data.data?.processing_time_ms,
          intent: data.data?.intent,
          sentiment: data.data?.sentiment,
        },
      }

      setMessages(prev => [...prev, userMessage, aiMessage])
      setInputValue('')

      // Add conversation turn if we have a conversation ID
      if (conversationId) {
        api.addConversationTurn(conversationId, 'user', variables.query)
        api.addConversationTurn(conversationId, 'assistant', data.data?.response || '')
      }

      // Get SOP suggestions
      if (variables.query.length > 10) {
        getSopSuggestions(variables.query)
      }
    },
  })

  // Get SOP suggestions mutation
  const sopSuggestionsMutation = useMutation({
    mutationFn: (query: string) => api.searchSOPs(query, 3),
    onSuccess: (data) => {
      setSOPSuggestions(data.data || [])
    },
  })

  const getSopSuggestions = (query: string) => {
    sopSuggestionsMutation.mutate(query)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // If no conversation started and customer selected, start one
    if (!conversationId && selectedCustomer) {
      startConversationMutation.mutate({
        customerId: selectedCustomer,
        initialMessage: inputValue.trim(),
      })
    }

    sendMessageMutation.mutate({
      query: inputValue.trim(),
      customerId: selectedCustomer || undefined,
    })
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const clearConversation = () => {
    setMessages([])
    setConversationId(null)
    setSelectedCustomer(null)
    setSOPSuggestions([])
  }

  const handleSOPSelect = (sop: ConfluencePage) => {
    const sopText = `Based on ${sop.title}: ${sop.content.slice(0, 200)}... (See full SOP: ${sop.url})`
    setInputValue(sopText)
    setShowSOPBrowser(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              AI Chat Assistant
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get AI-powered suggestions and assistance for customer interactions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Customer Selector */}
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value || null)}
              className="input w-64"
            >
              <option value="">Select a customer (optional)</option>
              {customersData?.data?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowSOPBrowser(!showSOPBrowser)}
              className={`btn-sm mr-2 ${showSOPBrowser ? 'btn-primary' : 'btn-outline'}`}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              SOPs
            </button>
            <button
              onClick={clearConversation}
              className="btn-outline btn-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex">
        {/* SOP Browser Sidebar */}
        {showSOPBrowser && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4">
              <SOPBrowser 
                onSelectSOP={handleSOPSelect}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start a conversation with AI
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Ask questions, get suggestions for customer responses, or analyze conversation sentiment.
                  You can select a customer to get personalized assistance.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl flex ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    } space-x-3`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div
                      className={`flex-1 ${
                        message.role === 'user' ? 'mr-3' : 'ml-3'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {message.metadata && (
                          <div className="mt-2 text-xs opacity-75">
                            Confidence: {Math.round((message.metadata.confidence_score || 0) * 100)}%
                            {message.metadata.intent && ` • Intent: ${message.metadata.intent}`}
                            {message.metadata.sentiment && ` • Sentiment: ${message.metadata.sentiment}`}
                          </div>
                        )}
                      </div>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Suggested responses:
                          </p>
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion.text)}
                              className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium capitalize">{suggestion.type}</span>
                                <span className="text-xs text-gray-500">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                              <p className="mt-1 text-gray-700 dark:text-gray-300">
                                {suggestion.text}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* SOP Suggestions */}
          {sopSuggestions.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Relevant SOPs
                </h4>
              </div>
              <div className="space-y-2">
                {sopSuggestions.map((sop) => (
                  <button
                    key={sop.id}
                    onClick={() => handleSOPSelect(sop)}
                    className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {sop.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {sop.spaceKey} • Updated {new Date(sop.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(sop.url, '_blank')
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask for help with customer interactions..."
                  className="input"
                  disabled={sendMessageMutation.isPending}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                className="btn-primary btn-md"
              >
                {sendMessageMutation.isPending ? (
                  <div className="loading-spinner mr-2" />
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}