import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, AuthSession } from '@/types'
import { api, supabase } from '@/services/api'
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
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthenticated = !!user && !!session

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        if (mounted && initialSession) {
          setSession(initialSession as AuthSession)
          setUser(initialSession.user as User)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, session?.user?.email)

        if (event === 'SIGNED_IN' && session) {
          setSession(session as AuthSession)
          setUser(session.user as User)
          
          // Redirect to intended page or dashboard
          const from = (location.state as any)?.from?.pathname || '/dashboard'
          navigate(from, { replace: true })
          
          toast.success(`Welcome back, ${session.user.user_metadata?.name || session.user.email}!`)
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          navigate('/auth/signin', { replace: true })
          toast.success('Signed out successfully')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session as AuthSession)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate, location])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      await api.signIn(email, password)
      // The onAuthStateChange will handle the rest
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      await api.signUp(email, password, name)
      toast.success('Account created! Please check your email to verify your account.')
      navigate('/auth/signin')
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
      await api.signOut()
      // The onAuthStateChange will handle the rest
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