import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { FormState } from '@/types'

interface SignInFormData {
  email: string
  password: string
}

export default function SignIn() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Logo and header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Optimus AI Assistant
              </h1>
              <p className="text-white/70">
                Sign in to access your AI-powered customer service dashboard
              </p>
            </motion.div>
            
            {/* Error display */}
            {(formState.errors.email || formState.errors.password) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6"
              >
                {formState.errors.email || formState.errors.password}
              </motion.div>
            )}
            
            {/* Modern form */}
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-6" 
              onSubmit={handleSubmit}
            >
              {/* Email input */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={formState.data.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Email address"
                  required
                />
              </div>
              
              {/* Password input */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formState.data.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={formState.isSubmitting || !formState.isValid}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {formState.isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Bot className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.form>
            
            {/* Sign up link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-white/70">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign up now
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}