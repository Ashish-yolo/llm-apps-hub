import { Menu, Transition } from '@headlessui/react'
import {
  PlusIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  DocumentChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const quickActions = [
  {
    name: 'Add Customer',
    description: 'Create a new customer record',
    href: '/customers?action=create',
    icon: UserPlusIcon,
  },
  {
    name: 'Start AI Chat',
    description: 'Begin a new AI-assisted conversation',
    href: '/ai-chat',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Generate Report',
    description: 'Create a new analytics report',
    href: '/reports?action=generate',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Settings',
    description: 'Configure system settings',
    href: '/settings',
    icon: CogIcon,
  },
]

export default function QuickActions() {
  const navigate = useNavigate()

  const handleActionClick = (href: string) => {
    navigate(href)
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="btn-primary btn-md">
          <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Quick Actions
        </Menu.Button>
      </div>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {quickActions.map((action) => (
              <Menu.Item key={action.name}>
                {({ active }) => (
                  <button
                    onClick={() => handleActionClick(action.href)}
                    className={`${
                      active
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } group flex items-center px-4 py-3 text-sm w-full text-left`}
                  >
                    <action.icon
                      className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium">{action.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}