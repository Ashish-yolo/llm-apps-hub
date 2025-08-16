import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(compression())
app.use(morgan('combined'))

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    supabase: !!process.env.SUPABASE_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY
  })
})

// Basic auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      success: true,
      data: { user: data.user },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      success: true,
      data: { user: data.user, session: data.session },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Basic AI query endpoint
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query } = req.body
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ 
        role: 'user', 
        content: `You are a helpful customer service AI assistant. Please respond to this customer query: ${query}` 
      }]
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : 'No response'

    res.json({
      success: true,
      data: {
        response,
        confidence_score: 0.85,
        processing_time_ms: 1500,
        intent: 'customer_support',
        sentiment: 'neutral'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI query error:', error)
    res.status(500).json({ error: 'Failed to process AI query' })
  }
})

// Basic customers endpoint
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// Basic dashboard metrics
app.get('/api/analytics/enhanced/dashboard/comprehensive', async (req, res) => {
  try {
    // Get basic counts
    const { data: customers } = await supabase.from('customers').select('id')
    const { data: interactions } = await supabase.from('interactions').select('id')
    const { data: aiResponses } = await supabase.from('ai_responses').select('id')

    res.json({
      success: true,
      data: {
        overview: {
          total_customers: customers?.length || 0,
          total_interactions: interactions?.length || 0,
          total_ai_queries: aiResponses?.length || 0,
          avg_response_time: 45000,
          customer_satisfaction: 0.87,
          resolution_rate: 0.92
        },
        trends: {
          customer_growth: [
            { date: '2024-01-15', count: 150 },
            { date: '2024-01-16', count: 175 }
          ],
          interaction_volume: [
            { date: '2024-01-15', count: 89 },
            { date: '2024-01-16', count: 102 }
          ],
          ai_usage: [
            { date: '2024-01-15', count: 45 },
            { date: '2024-01-16', count: 67 }
          ],
          satisfaction_trend: [
            { date: '2024-01-15', score: 0.85 },
            { date: '2024-01-16', score: 0.87 }
          ]
        },
        performance: {
          top_agents: [
            {
              agent_id: '1',
              agent_name: 'Demo Agent',
              total_interactions: 45,
              avg_response_time: 30000,
              satisfaction_score: 0.92,
              resolution_rate: 0.95
            }
          ],
          ai_metrics: {
            total_queries: aiResponses?.length || 0,
            avg_confidence: 0.85,
            cache_hit_rate: 0.23,
            error_rate: 0.02
          }
        },
        insights: {
          peak_hours: [
            { hour: 9, interaction_count: 15 },
            { hour: 14, interaction_count: 23 }
          ],
          popular_channels: [
            { channel: 'email', count: 45, percentage: 60 },
            { channel: 'chat', count: 30, percentage: 40 }
          ],
          sentiment_distribution: {
            positive: 0.45,
            neutral: 0.35,
            negative: 0.20
          },
          escalation_rate: 0.15
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' })
  }
})

// Basic realtime metrics
app.get('/api/analytics/enhanced/realtime', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Active Sessions',
          value: 23,
          change_percentage: 12.5,
          trend: 'up',
          last_updated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Response Time',
          value: 45,
          change_percentage: -8.2,
          trend: 'down',
          last_updated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Satisfaction Score',
          value: 87,
          change_percentage: 3.1,
          trend: 'up',
          last_updated: new Date().toISOString()
        }
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch realtime metrics' })
  }
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 GenAI CRM API Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Process terminated')
    process.exit(0)
  })
})

export default app