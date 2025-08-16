export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

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

export interface AIResponse {
  id: string;
  query: string;
  response: string;
  context?: Record<string, any>;
  confidence_score?: number;
  processing_time_ms: number;
  created_at: string;
}

export interface Analytics {
  id: string;
  metric_name: string;
  metric_value: number;
  dimensions?: Record<string, any>;
  date: string;
  created_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AIQueryRequest {
  query: string;
  context?: Record<string, any>;
  customer_id?: string;
}

export interface CustomerCreateRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface InteractionCreateRequest {
  customer_id: string;
  type: 'email' | 'phone' | 'chat' | 'meeting' | 'other';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

export interface AnalyticsQueryRequest {
  start_date: string;
  end_date: string;
  metrics?: string[];
  filters?: Record<string, any>;
}