import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FormState } from '@/types'

interface SignUpFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignUp() {
  const { signUp } = useAuth()
  
  const [formState, setFormState] = useState<FormState<SignUpFormData>>({
    data: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    errors: {},
    isSubmitting: false,
    isValid: false,
  })

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formState.data.name) {
      errors.name = 'Name is required'
    } else if (formState.data.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    
    if (!formState.data.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formState.data.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!formState.data.password) {
      errors.password = 'Password is required'
    } else if (formState.data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formState.data.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (!formState.data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formState.data.password !== formState.data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFormState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }))

    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
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
      await signUp(formState.data.email, formState.data.password, formState.data.name)
      // Navigation is handled by AuthContext
    } catch (error) {
      console.error('Sign up error:', error)
      // Error toast is handled by AuthContext
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="input"
                placeholder="Enter your full name"
                value={formState.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              {formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{formState.errors.name}</p>
              )}
            </div>
            
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
                <p className="mt-1 text-sm text-red-600">{formState.errors.email}</p>
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
                autoComplete="new-password"
                required
                className="input"
                placeholder="Create a password"
                value={formState.data.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              {formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{formState.errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="Confirm your password"
                value={formState.data.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              />
              {formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formState.errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </label>
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
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}