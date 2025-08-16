import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FormState } from '@/types'

interface SignInFormData {
  email: string
  password: string
}

export default function SignIn() {
  const { signIn } = useAuth()
  
  const [formState, setFormState] = useState<FormState<SignInFormData>>({
    data: {
      email: '',
      password: '',
    },
    errors: {},
    isSubmitting: false,
    isValid: false,
  })

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formState.data.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formState.data.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!formState.data.password) {
      errors.password = 'Password is required'
    } else if (formState.data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFormState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }))

    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof SignInFormData, value: string) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }))

    try {
      await signIn(formState.data.email, formState.data.password)
      // Navigation is handled by AuthContext
    } catch (error) {
      console.error('Sign in error:', error)
      // Error toast is handled by AuthContext
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-600">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
            Or{' '}
            <Link
              to="/auth/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="Enter your email"
                value={formState.data.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              {formState.errors.email && (
                <p className="mt-1 text-sm text-danger-600">{formState.errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="Enter your password"
                value={formState.data.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              {formState.errors.password && (
                <p className="mt-1 text-sm text-danger-600">{formState.errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-900 dark:text-secondary-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={formState.isSubmitting || !formState.isValid}
              className="btn-primary w-full btn-md"
            >
              {formState.isSubmitting ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}