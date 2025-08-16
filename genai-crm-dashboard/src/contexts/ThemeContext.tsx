import React, { createContext, useContext, useEffect, useState } from 'react'
import { Theme, ThemeConfig } from '@/types'

interface ThemeContextType {
  theme: Theme
  themeConfig: ThemeConfig
  setTheme: (theme: Theme) => void
  updateThemeConfig: (config: Partial<ThemeConfig>) => void
  isDark: boolean
  isLight: boolean
  isSystem: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'genai-crm-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const savedConfig = localStorage.getItem(`${storageKey}-config`)
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig)
      } catch {
        // Ignore JSON parsing errors
      }
    }
    
    return {
      theme,
      primaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
      fontFamily: 'Inter',
    }
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement

    // Apply custom CSS properties for theming
    root.style.setProperty('--primary-color', themeConfig.primaryColor)
    root.style.setProperty('--accent-color', themeConfig.accentColor)
    root.style.setProperty('--font-family', themeConfig.fontFamily)
  }, [themeConfig])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
    
    // Update the theme config
    setThemeConfig(prev => ({
      ...prev,
      theme: newTheme,
    }))
  }

  const updateThemeConfig = (config: Partial<ThemeConfig>) => {
    const newConfig = { ...themeConfig, ...config }
    setThemeConfig(newConfig)
    localStorage.setItem(`${storageKey}-config`, JSON.stringify(newConfig))
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)
  const isSystem = theme === 'system'

  const value: ThemeContextType = {
    theme,
    themeConfig,
    setTheme,
    updateThemeConfig,
    isDark,
    isLight,
    isSystem,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}