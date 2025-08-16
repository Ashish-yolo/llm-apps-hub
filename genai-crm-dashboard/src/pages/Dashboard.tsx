import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import MetricsOverview from '@/components/dashboard/MetricsOverview'
import RealtimeMetrics from '@/components/dashboard/RealtimeMetrics'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import QuickActions from '@/components/dashboard/QuickActions'

export default function Dashboard() {
  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.getDashboardMetrics(),
  })

  const { data: realtimeMetrics, isLoading: realtimeLoading } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: () => api.getRealTimeMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (metricsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded-lg" />
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your CRM.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <QuickActions />
        </div>
      </div>

      {/* Metrics Overview */}
      <MetricsOverview 
        data={dashboardMetrics?.data} 
        loading={metricsLoading}
      />

      {/* Real-time Metrics */}
      <RealtimeMetrics 
        data={realtimeMetrics?.data} 
        loading={realtimeLoading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              AI Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Customer satisfaction increased by 12% this week
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Based on sentiment analysis
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-600 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Response time spike detected in email channel
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Requires attention
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    AI suggestions acceptance rate at 87%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Above target
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Agents */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Top Agents
            </h3>
            <div className="space-y-4">
              {dashboardMetrics?.data?.performance?.top_agents?.slice(0, 3).map((agent) => (
                <div key={agent.agent_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {agent.agent_name?.charAt(0) || '#'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.agent_name || `Agent ${agent.agent_id}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.satisfaction_score}% satisfaction
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {agent.total_interactions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      interactions
                    </p>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}