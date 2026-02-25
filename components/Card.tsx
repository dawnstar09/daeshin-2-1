'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  hover?: boolean
  className?: string
  onClick?: () => void
}

export default function Card({ children, hover = false, className = '', onClick }: CardProps) {
  const Component = hover ? motion.div : 'div'
  const baseClass = hover ? 'card-hover' : 'card'

  const motionProps = hover ? {
    whileHover: { y: -4 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  } : {}

  return (
    <Component
      className={`${baseClass} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  )
}
