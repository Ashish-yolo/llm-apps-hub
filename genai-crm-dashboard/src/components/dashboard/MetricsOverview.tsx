import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ClockIcon,
  FaceSmileIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { DashboardMetrics } from '@/types'

interface MetricsOverviewProps {
  data?: DashboardMetrics
  loading?: boolean
}

export default function MetricsOverview({ data, loading }: MetricsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      name: 'Total Customers',
      value: data?.overview.total_customers || 0,
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      name: 'Interactions',
      value: data?.overview.total_interactions || 0,
      icon: ChatBubbleLeftRightIcon,
      change: '+8%',
      changeType: 'increase' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      name: 'AI Queries',
      value: data?.overview.total_ai_queries || 0,
      icon: CpuChipIcon,
      change: '+23%',
      changeType: 'increase' as const,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      name: 'Avg Response Time',
      value: `${Math.round((data?.overview.avg_response_time || 0) / 60)}m`,
      icon: ClockIcon,
      change: '-5%',
      changeType: 'decrease' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      name: 'Satisfaction',
      value: `${Math.round((data?.overview.customer_satisfaction || 0) * 100)}%`,
      icon: FaceSmileIcon,
      change: '+3%',
      changeType: 'increase' as const,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
    },
    {
      name: 'Resolution Rate',
      value: `${Math.round((data?.overview.resolution_rate || 0) * 100)}%`,
      icon: CheckCircleIcon,
      change: '+7%',
      changeType: 'increase' as const,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric) => (
        <div key={metric.name} className="card p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${metric.bgColor} rounded-md p-3`}>
              <metric.icon
                className={`h-6 w-6 ${metric.color}`}
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {metric.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </div>
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      metric.changeType === 'increase'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {metric.change}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}