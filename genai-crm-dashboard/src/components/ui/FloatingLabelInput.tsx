import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = props.value && String(props.value).length > 0

    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          className={`
            peer w-full px-4 py-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder-transparent transition-all duration-300
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          placeholder={label}
        />
        <motion.label
          animate={{
            y: isFocused || hasValue ? -28 : 0,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused ? '#3B82F6' : error ? '#EF4444' : '#6B7280'
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute left-4 top-4 pointer-events-none origin-left font-medium"
        >
          {label}
        </motion.label>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

FloatingLabelInput.displayName = 'FloatingLabelInput'