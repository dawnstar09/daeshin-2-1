'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
}

export default function Button({ 
  variant = 'primary',
  size = 'medium',
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseClass = variant === 'primary' 
    ? 'btn-primary' 
    : variant === 'secondary' 
    ? 'btn-secondary' 
    : 'btn-ghost'

  const sizeClass = size === 'small'
    ? 'px-3 py-1.5 text-sm'
    : size === 'large'
    ? 'px-6 py-4 text-lg'
    : 'px-4 py-2.5'

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
