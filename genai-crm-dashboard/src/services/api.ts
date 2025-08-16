import { createClient } from '@supabase/supabase-js'
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Customer,
  CustomerAnalytics,
  Interaction,
  AIQueryRequest,
  AIResponse,
  DashboardMetrics,
  RealTimeMetric,
  ReportData,
  ScheduledReport,
  AlertRule,
  ConversationContext,
  ConfluenceSpace,
  ConfluencePage,
  ConfluenceSearchResult,
} from '@/types'

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized - redirect to login
        await supabase.auth.signOut()
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }
      
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // Ignore JSON parsing errors
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Authentication API
  async signIn(email: string, password: string): Promise<ApiResponse<{ user: User; session: any }>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: {
        user: data.user as User,
        session: data.session,
      },
      timestamp: new Date().toISOString(),
    }
  }

  async signUp(email: string, password: string, name: string): Promise<ApiResponse<{ user: User }>> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: {
        user: data.user as User,
      },
      timestamp: new Date().toISOString(),
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user as User | null
  }

  // Dashboard API
  async getDashboardMetrics(
    startDate?: string,
    endDate?: string,
    agentId?: string
  ): Promise<ApiResponse<DashboardMetrics>> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (agentId) params.append('agent_id', agentId)

    return this.request(`/analytics/enhanced/dashboard/comprehensive?${params}`)
  }

  async getRealTimeMetrics(): Promise<ApiResponse<RealTimeMetric[]>> {
    return this.request('/analytics/enhanced/realtime')
  }

  async getMetricHistory(
    metricName: string,
    startDate: string,
    endDate: string,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      granularity,
    })

    return this.request(`/analytics/enhanced/metrics/${metricName}/history?${params}`)
  }

  // Customer API
  async getCustomers(
    page = 1,
    limit = 25,
    search?: string
  ): Promise<PaginatedResponse<Customer[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (search) params.append('search', search)

    return this.request(`/customers?${params}`)
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return this.request(`/customers/${id}`)
  }

  async getCustomerAnalytics(
    customerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<CustomerAnalytics>> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    return this.request(`/analytics/enhanced/customer/${customerId}?${params}`)
  }

  async createCustomer(customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    })
  }

  // Interactions API
  async getInteractions(
    page = 1,
    limit = 25,
    customerId?: string
  ): Promise<PaginatedResponse<Interaction[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (customerId) params.append('customer_id', customerId)

    return this.request(`/interactions?${params}`)
  }

  async createInteraction(interaction: Partial<Interaction>): Promise<ApiResponse<Interaction>> {
    return this.request('/interactions', {
      method: 'POST',
      body: JSON.stringify(interaction),
    })
  }

  // AI API
  async processAIQuery(request: AIQueryRequest): Promise<ApiResponse<AIResponse>> {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async generateSuggestions(
    query: string,
    interactionType: string,
    context?: Record<string, any>
  ): Promise<ApiResponse<{ suggestions: any[] }>> {
    return this.request('/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        query,
        interaction_type: interactionType,
        context,
      }),
    })
  }

  // Conversation API
  async startConversation(
    customerId: string,
    initialMessage?: string
  ): Promise<ApiResponse<{ conversation_id: string }>> {
    return this.request('/ai/enhanced/conversation/start', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        initial_message: initialMessage,
      }),
    })
  }

  async getConversation(conversationId: string): Promise<ApiResponse<ConversationContext>> {
    return this.request(`/ai/enhanced/conversation/${conversationId}`)
  }

  async addConversationTurn(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<any>> {
    return this.request(`/ai/enhanced/conversation/${conversationId}/turn`, {
      method: 'POST',
      body: JSON.stringify({
        role,
        content,
        metadata,
      }),
    })
  }

  async getActiveConversations(): Promise<ApiResponse<ConversationContext[]>> {
    return this.request('/ai/enhanced/conversations/active')
  }

  // Reports API
  async generateExecutiveSummary(
    startDate: string,
    endDate: string,
    agentId?: string
  ): Promise<ApiResponse<any>> {
    return this.request('/analytics/enhanced/reports/executive-summary', {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        agent_id: agentId,
      }),
    })
  }

  async generateDetailedReport(
    reportType: string,
    startDate: string,
    endDate: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<ReportData>> {
    return this.request('/analytics/enhanced/reports/detailed', {
      method: 'POST',
      body: JSON.stringify({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        filters,
      }),
    })
  }

  async exportReport(
    reportId: string,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    options?: Record<string, any>
  ): Promise<ApiResponse<{ download_url: string; file_size: number; expires_at: string }>> {
    return this.request(`/analytics/enhanced/reports/${reportId}/export`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        options,
      }),
    })
  }

  async getScheduledReports(): Promise<ApiResponse<ScheduledReport[]>> {
    return this.request('/analytics/enhanced/reports/scheduled')
  }

  async scheduleReport(report: Partial<ScheduledReport>): Promise<ApiResponse<{ report_id: string }>> {
    return this.request('/analytics/enhanced/reports/schedule', {
      method: 'POST',
      body: JSON.stringify(report),
    })
  }

  // Alerts API
  async getActiveAlerts(): Promise<ApiResponse<AlertRule[]>> {
    return this.request('/analytics/enhanced/alerts/active')
  }

  async createAlert(alert: Omit<AlertRule, 'id'>): Promise<ApiResponse<{ alert_id: string }>> {
    return this.request('/analytics/enhanced/alerts/create', {
      method: 'POST',
      body: JSON.stringify(alert),
    })
  }

  async updateAlert(alertId: string, updates: Partial<AlertRule>): Promise<ApiResponse<any>> {
    return this.request(`/analytics/enhanced/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteAlert(alertId: string): Promise<ApiResponse<any>> {
    return this.request(`/analytics/enhanced/alerts/${alertId}`, {
      method: 'DELETE',
    })
  }

  // Charts API
  async getChartData(
    chartType: string,
    startDate?: string,
    endDate?: string,
    agentId?: string
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (agentId) params.append('agent_id', agentId)

    return this.request(`/analytics/enhanced/charts/${chartType}?${params}`)
  }

  async getVisualizationConfig(): Promise<ApiResponse<any>> {
    return this.request('/analytics/enhanced/visualizations/config')
  }

  // Metrics recording
  async recordMetric(
    metricName: string,
    value: number,
    dimensions?: Record<string, any>,
    customerId?: string
  ): Promise<ApiResponse<any>> {
    return this.request('/analytics/enhanced/metrics/record', {
      method: 'POST',
      body: JSON.stringify({
        metric_name: metricName,
        value,
        dimensions,
        customer_id: customerId,
      }),
    })
  }

  // Confluence API
  async getConfluenceSpaces(): Promise<ApiResponse<ConfluenceSpace[]>> {
    return this.request('/confluence/spaces')
  }

  async searchConfluencePages(
    query: string,
    spaceKey?: string,
    limit?: number
  ): Promise<ApiResponse<ConfluenceSearchResult>> {
    const params = new URLSearchParams({ query })
    if (spaceKey) params.append('spaceKey', spaceKey)
    if (limit) params.append('limit', limit.toString())

    return this.request(`/confluence/search?${params}`)
  }

  async searchSOPs(
    query: string,
    limit?: number
  ): Promise<ApiResponse<ConfluencePage[]>> {
    const params = new URLSearchParams({ query })
    if (limit) params.append('limit', limit.toString())

    return this.request(`/confluence/sops/search?${params}`)
  }

  async getConfluencePage(pageId: string): Promise<ApiResponse<ConfluencePage>> {
    return this.request(`/confluence/pages/${pageId}`)
  }

  async getConfluencePagesBySpace(
    spaceKey: string,
    limit?: number,
    start?: number
  ): Promise<ApiResponse<ConfluencePage[]>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (start) params.append('start', start.toString())

    return this.request(`/confluence/spaces/${spaceKey}/pages?${params}`)
  }

  async getRecentConfluencePages(
    spaceKey?: string,
    days?: number,
    limit?: number
  ): Promise<ApiResponse<ConfluencePage[]>> {
    const params = new URLSearchParams()
    if (spaceKey) params.append('spaceKey', spaceKey)
    if (days) params.append('days', days.toString())
    if (limit) params.append('limit', limit.toString())

    return this.request(`/confluence/recent?${params}`)
  }

  async getSOPSuggestions(
    query: string,
    customerId?: string,
    interactionType?: string
  ): Promise<ApiResponse<any>> {
    return this.request('/confluence/sops/suggest', {
      method: 'POST',
      body: JSON.stringify({
        query,
        customerId,
        interactionType,
      }),
    })
  }

  async testConfluenceConnection(): Promise<ApiResponse<any>> {
    return this.request('/confluence/health')
  }
}

export const api = new ApiService()
export default api