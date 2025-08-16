import { useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

interface TopNavigationProps {
  onMenuClick: () => void
}

export default function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { user, signOut } = useAuth()
  const { setTheme, isDark, isLight, isSystem } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const themeOptions = [
    { name: 'Light', value: 'light' as const, icon: SunIcon, active: isLight },
    { name: 'Dark', value: 'dark' as const, icon: MoonIcon, active: isDark },
    { name: 'System', value: 'system' as const, icon: ComputerDesktopIcon, active: isSystem },
  ]

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-secondary-800 border-b border-border">
      <button
        type="button"
        className="px-4 border-r border-border text-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <form className="w-full flex md:ml-0" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-secondary-400 focus-within:text-secondary-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400 focus:outline-none focus:placeholder-secondary-400 focus:ring-0 focus:border-transparent bg-transparent"
                placeholder="Search customers, interactions..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Theme Selector */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="p-1 rounded-full text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Change theme</span>
                {isDark && <MoonIcon className="h-6 w-6" aria-hidden="true" />}
                {isLight && <SunIcon className="h-6 w-6" aria-hidden="true" />}
                {isSystem && <ComputerDesktopIcon className="h-6 w-6" aria-hidden="true" />}
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
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                {themeOptions.map((option) => (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => setTheme(option.value)}
                        className={`${
                          active ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                        } ${
                          option.active ? 'text-primary-600' : 'text-secondary-700 dark:text-secondary-300'
                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                      >
                        <option.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                        {option.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Notifications */}
          <button
            type="button"
            className="ml-3 p-1 rounded-full text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="ml-3 relative">
            <div>
              <Menu.Button className="max-w-xs bg-white dark:bg-secondary-800 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
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
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 border-b border-secondary-200 dark:border-secondary-700">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400">
                    {user?.email}
                  </p>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${
                        active ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                      } block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300`}
                    >
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${
                        active ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                      } block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300`}
                    >
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={`${
                        active ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                      } block w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}