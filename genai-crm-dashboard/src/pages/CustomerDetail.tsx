import { useParams } from 'react-router-dom'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Customer Details
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customer ID: {id}
          </p>
        </div>
      </div>

      <div className="card p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Customer Profile
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Customer detail view coming soon...
        </p>
      </div>
    </div>
  )
}