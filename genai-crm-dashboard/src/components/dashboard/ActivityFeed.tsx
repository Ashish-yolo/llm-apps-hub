import { useQuery } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface ActivityItem {
  id: string
  type: 'interaction' | 'customer' | 'report' | 'alert'
  title: string
  description: string
  timestamp: string
  user?: string
  metadata?: Record<string, any>
}

const activityIcons = {
  interaction: ChatBubbleLeftRightIcon,
  customer: UserPlusIcon,
  report: DocumentChartBarIcon,
  alert: ExclamationTriangleIcon,
}

const activityColors = {
  interaction: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
  customer: 'text-green-600 bg-green-100 dark:bg-green-900',
  report: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
  alert: 'text-red-600 bg-red-100 dark:bg-red-900',
}

// Mock data for demo - replace with real API call
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'interaction',
    title: 'New customer inquiry',
    description: 'Sarah Chen submitted a support ticket about billing',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    user: 'AI Assistant',
  },
  {
    id: '2',
    type: 'customer',
    title: 'New customer registered',
    description: 'John Smith created an account and completed onboarding',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user: 'System',
  },
  {
    id: '3',
    type: 'alert',
    title: 'Response time alert',
    description: 'Average response time exceeded 2 minutes threshold',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: 'Monitoring System',
  },
  {
    id: '4',
    type: 'report',
    title: 'Weekly report generated',
    description: 'Customer satisfaction report for week ending Dec 15',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: 'Report Scheduler',
  },
  {
    id: '5',
    type: 'interaction',
    title: 'Issue resolved',
    description: 'Product return issue resolved for customer Maria Garcia',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    user: 'Agent Smith',
  },
]

export default function ActivityFeed() {
  // This would be a real API call in production
  const { data: activities = mockActivities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => Promise.resolve(mockActivities),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          View all
        </button>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, activityIdx) => {
            const Icon = activityIcons[activity.type]
            const colors = activityColors[activity.type]

            return (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${colors}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            by {activity.user}
                          </p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No recent activity
          </p>
        </div>
      )}
    </div>
  )
}