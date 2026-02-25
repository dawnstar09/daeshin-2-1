'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Card from '@/components/Card'

const menuItems = [
  {
    title: '야자 출석',
    description: '야간 자율학습 출석 체크',
    href: '/yaja-attendance',
    icon: '✅',
    color: 'bg-teal-500',
  },
  {
    title: '야자 통계',
    description: '야간 자율학습 통계 및 관리',
    href: '/yaja-stats',
    icon: '📊',
    color: 'bg-blue-500',
  },
  {
    title: '수행평가',
    description: '수행평가 일정 및 관리',
    href: '/suhang',
    icon: '📝',
    color: 'bg-green-500',
  },
  {
    title: '학특사',
    description: '학교 특색 사업 신청 및 관리',
    href: '/hagteugsa',
    icon: '🎯',
    color: 'bg-purple-500',
  },
  {
    title: '급식표',
    description: 'NEIS 중식 정보 + 석식 사진',
    href: '/food-calendar',
    icon: '🍱',
    color: 'bg-orange-500',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function HomePage() {
  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-4">
          대신고 2-5반 🎓
        </h1>
        <p className="text-xl text-toss-gray-600 dark:text-toss-gray-300">
          우리 반을 위한 스마트 클래스 관리 시스템
        </p>
      </motion.div>

      {/* Menu Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {menuItems.map((menuItem) => (
          <motion.div key={menuItem.href} variants={item}>
            <Link href={menuItem.href}>
              <Card hover className="p-6 h-full">
                <div className="flex items-start space-x-4">
                  <div className={`${menuItem.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                    {menuItem.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-1">
                      {menuItem.title}
                    </h3>
                    <p className="text-sm text-toss-gray-600 dark:text-toss-gray-400">
                      {menuItem.description}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-toss-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
