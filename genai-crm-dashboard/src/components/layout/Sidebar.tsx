import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentChartBarIcon,
  CogIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { NavItem } from '@/types'

interface SidebarProps {
  onClose?: () => void
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: UsersIcon,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
  },
  {
    name: 'AI Chat',
    href: '/ai-chat',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
  },
]

export default function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="flex flex-col flex-grow border-r border-border bg-white dark:bg-secondary-800 pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="ml-2 text-xl font-semibold text-secondary-900 dark:text-white">
            GenAI CRM
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-auto lg:hidden rounded-md p-2 text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      
      <div className="mt-5 flex-grow flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 border-r-2 border-primary-600'
                    : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-secondary-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-primary-100 text-primary-600">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-secondary-200 dark:bg-secondary-600 flex items-center justify-center">
            <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
              AI
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              AI Assistant
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              Ready to help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}