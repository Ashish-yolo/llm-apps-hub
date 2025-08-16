// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomerAnalytics {
  customer_lifetime_value: number;
  interaction_frequency: number;
  satisfaction_score: number;
  issue_resolution_time: number;
  preferred_channels: string[];
  interaction_history: Array<{
    date: string;
    type: string;
    sentiment: string;
    resolved: boolean;
  }>;
  ai_assistance_usage: {
    total_queries: number;
    avg_confidence: number;
    most_common_intents: string[];
  };
}

// Interaction Types
export interface Interaction {
  id: string;
  customer_id: string;
  agent_id: string;
  type: 'email' | 'phone' | 'chat' | 'meeting' | 'other';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  ai_suggestions?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// AI Types
export interface AIResponse {
  response: string;
  confidence_score: number;
  processing_time_ms: number;
  suggestions?: Array<{
    type: 'direct' | 'detailed' | 'empathetic';
    text: string;
    confidence: number;
  }>;
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

export interface AIQueryRequest {
  query: string;
  context?: Record<string, any>;
  customer_id?: string;
}

export interface ConversationContext {
  customer_id: string;
  agent_id: string;
  conversation_id: string;
  turns: ConversationTurn[];
  summary?: string;
  status: 'active' | 'resolved' | 'escalated' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Analytics Types
export interface DashboardMetrics {
  overview: {
    total_customers: number;
    total_interactions: number;
    total_ai_queries: number;
    avg_response_time: number;
    customer_satisfaction: number;
    resolution_rate: number;
  };
  trends: {
    customer_growth: Array<{ date: string; count: number }>;
    interaction_volume: Array<{ date: string; count: number }>;
    ai_usage: Array<{ date: string; count: number }>;
    satisfaction_trend: Array<{ date: string; score: number }>;
  };
  performance: {
    top_agents: Array<{
      agent_id: string;
      agent_name: string;
      total_interactions: number;
      avg_response_time: number;
      satisfaction_score: number;
      resolution_rate: number;
    }>;
    ai_metrics: {
      total_queries: number;
      avg_confidence: number;
      cache_hit_rate: number;
      error_rate: number;
    };
  };
  insights: {
    peak_hours: Array<{ hour: number; interaction_count: number }>;
    popular_channels: Array<{ channel: string; count: number; percentage: number }>;
    sentiment_distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    escalation_rate: number;
  };
}

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
}

// Report Types
export interface ReportData {
  report_id: string;
  report_type: 'performance' | 'customer' | 'ai' | 'business';
  title: string;
  description: string;
  data: any;
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    title: string;
    data: any;
    config: any;
  }>;
  generated_at: string;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  report_type: 'performance' | 'customer' | 'ai' | 'business' | 'custom';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    day_of_week?: number;
    day_of_month?: number;
    timezone: string;
  };
  recipients: Array<{
    email: string;
    format: 'pdf' | 'excel' | 'json';
  }>;
  filters: Record<string, any>;
  enabled: boolean;
  created_by: string;
  last_run?: string;
  next_run: string;
}

// Alert Types
export interface AlertRule {
  id: string;
  name: string;
  metric_name: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percentage';
  threshold: number;
  time_window_minutes: number;
  enabled: boolean;
  notification_channels: string[];
}

export interface AlertTrigger {
  alert_id: string;
  alert_name: string;
  metric_name: string;
  metric_value: number;
  threshold: number;
  condition: string;
  triggered_at: string;
}

// Chart Types
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  title: string;
  data: any[];
  config: {
    xField?: string;
    yField?: string;
    colorField?: string;
    angleField?: string;
    seriesField?: string;
    smooth?: boolean;
    [key: string]: any;
  };
}

// UI Types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
  badge?: string | number;
  children?: NavItem[];
}

export interface TabItem {
  name: string;
  href: string;
  current?: boolean;
  count?: number;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

// Utility Types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingState {
  status: Status;
  error?: string;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

// Confluence Types
export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: 'global' | 'personal';
}

export interface ConfluencePage {
  id: string;
  title: string;
  content: string;
  spaceKey: string;
  spaceId: string;
  url: string;
  lastModified: string;
  version: number;
  labels: string[];
  excerpt?: string;
}

export interface ConfluenceSearchResult {
  pages: ConfluencePage[];
  totalResults: number;
  searchTime: number;
}