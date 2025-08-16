import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, AuthSession } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // For demo purposes, make it not authenticated initially so we can see the SignIn page
  const isAuthenticated = false

  const signIn = async (email: string, _password: string) => {
    try {
      setLoading(true)
      // Demo implementation - just create a mock user
      const mockUser: User = {
        id: '1',
        email,
        name: 'Demo User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const mockSession: AuthSession = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_at: Date.now() + 3600000,
        user: mockUser
      }
      
      setUser(mockUser)
      setSession(mockSession)
      toast.success('Signed in successfully!')
      navigate('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (_email: string, _password: string, _name: string) => {
    try {
      setLoading(true)
      // Demo implementation
      toast.success('Account created! Please sign in.')
      navigate('/signin')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setUser(null)
      setSession(null)
      toast.success('Signed out successfully')
      navigate('/signin')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}