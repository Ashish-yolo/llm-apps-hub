import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/solid'
import { RealTimeMetric } from '@/types'

interface RealtimeMetricsProps {
  data?: RealTimeMetric[]
  loading?: boolean
}

export default function RealtimeMetrics({ data, loading }: RealtimeMetricsProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
      case 'stable':
        return <MinusIcon className="h-4 w-4 text-gray-400" />
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Real-time Metrics
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.map((metric) => (
          <div
            key={metric.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {metric.name}
              </p>
              {getTrendIcon(metric.trend)}
            </div>
            
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </p>
              <p className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                {metric.change_percentage > 0 ? '+' : ''}
                {metric.change_percentage.toFixed(1)}%
              </p>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Updated {new Date(metric.last_updated).toLocaleTimeString()}
            </p>
          </div>
        )) || []}
      </div>

      {!data || data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No real-time metrics available
          </p>
        </div>
      ) : null}
    </div>
  )
}