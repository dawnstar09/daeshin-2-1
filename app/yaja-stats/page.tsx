'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, remove } from 'firebase/database'
import { motion } from 'framer-motion'
import Card from '@/components/Card'
import Input from '@/components/Input'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface YajaRecord {
  id: string
  date: string
  period: number
  studentName: string
  studentCode: string
  studentNumber: string
  reason: string
  createdAt: number
}

export default function YajaStatsPage() {
  const [records, setRecords] = useState<YajaRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<YajaRecord[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch data from Firebase
  useEffect(() => {
    const yajaRef = ref(database, 'yaja_students')
    const unsubscribe = onValue(yajaRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const recordsList = Object.entries(data).map(([id, record]: [string, any]) => ({
          id,
          ...record,
        }))
        setRecords(recordsList)
      } else {
        setRecords([])
      }
    })

    return () => unsubscribe()
  }, [])

  // Filter records
  useEffect(() => {
    let filtered = records

    if (selectedDate !== 'all') {
      filtered = filtered.filter(r => r.date === selectedDate)
    }

    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(r => r.period === parseInt(selectedPeriod))
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.studentName.includes(searchTerm) || 
        r.studentNumber.includes(searchTerm) ||
        r.reason.includes(searchTerm)
      )
    }

    setFilteredRecords(filtered)
  }, [records, selectedDate, selectedPeriod, searchTerm])

  // Delete record
  const handleDelete = async (id: string) => {
    const password = prompt('삭제하려면 비밀번호를 입력하세요:')
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    
    if (confirm('정말 삭제하시겠습니까?')) {
      const recordRef = ref(database, `yaja_students/${id}`)
      await remove(recordRef)
    }
  }

  // Statistics
  const stats = {
    total: filteredRecords.length,
    byPeriod: filteredRecords.reduce((acc, record) => {
      acc[record.period] = (acc[record.period] || 0) + 1
      return acc
    }, {} as Record<number, number>),
    topReasons: Object.entries(
      filteredRecords.reduce((acc, record) => {
        // "동아리: 과학동아리" -> "동아리"로 그룹화
        const mainReason = record.reason.includes(':') 
          ? record.reason.split(':')[0].trim() 
          : record.reason
        acc[mainReason] = (acc[mainReason] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
  }

  // Get unique dates
  const uniqueDates = Array.from(new Set(records.map(r => r.date)))
    .sort((a, b) => b.localeCompare(a)) // 최신 날짜 우선

  // Chart data
  const periodChartData = {
    labels: ['야자 1차시', '야자 2차시', '야자 3차시'],
    datasets: [
      {
        label: '불참 횟수',
        data: [1, 2, 3].map(p => stats.byPeriod[p] || 0),
        backgroundColor: 'rgba(49, 130, 246, 0.5)',
        borderColor: 'rgba(49, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const reasonChartData = {
    labels: stats.topReasons.map(([reason]) => reason),
    datasets: [
      {
        data: stats.topReasons.map(([, count]) => count),
        backgroundColor: [
          'rgba(49, 130, 246, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(251, 146, 60, 0.5)',
          'rgba(168, 85, 247, 0.5)',
          'rgba(236, 72, 153, 0.5)',
        ],
        borderColor: [
          'rgba(49, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-2">야자 통계 📊</h1>
          <p className="text-toss-gray-600 dark:text-toss-gray-300">야간 자율학습 불참 현황 및 통계</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">전체 날짜</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </option>
              ))}
            </select>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">전체 차시</option>
              <option value="1">야자 1차시</option>
              <option value="2">야자 2차시</option>
              <option value="3">야자 3차시</option>
            </select>
            <div className="flex-1">
              <Input
                placeholder="이름, 번호, 사유 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 dark:text-toss-gray-400 mb-1">총 불참 횟수</div>
            <div className="text-2xl font-bold text-toss-blue">{stats.total}회</div>
          </Card>
          {[1, 2, 3].map(period => (
            <Card key={period} className="p-4">
              <div className="text-sm text-toss-gray-600 dark:text-toss-gray-400 mb-1">야자 {period}차시 불참</div>
              <div className="text-2xl font-bold text-toss-gray-900 dark:text-toss-gray-50">
                {stats.byPeriod[period] || 0}회
              </div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-4">차시별 불참 현황</h3>
            <Bar data={periodChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-4">불참 사유 TOP 5</h3>
            {stats.topReasons.length > 0 ? (
              <Pie data={reasonChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            ) : (
              <div className="text-center text-toss-gray-500 dark:text-toss-gray-400 py-8">데이터가 없습니다</div>
            )}
          </Card>
        </div>
      </motion.div>

      {/* Records Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-toss-gray-50 dark:bg-toss-gray-700 border-b border-toss-gray-200 dark:border-toss-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-toss-gray-700 dark:text-toss-gray-300 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-toss-gray-700 dark:text-toss-gray-300 uppercase tracking-wider">차시</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-toss-gray-700 dark:text-toss-gray-300 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-toss-gray-700 dark:text-toss-gray-300 uppercase tracking-wider">번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-toss-gray-700 dark:text-toss-gray-300 uppercase tracking-wider">사유</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-toss-gray-700 dark:text-toss-gray-300 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-toss-gray-800 divide-y divide-toss-gray-200 dark:divide-toss-gray-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-toss-gray-500 dark:text-toss-gray-400">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-toss-gray-50 dark:hover:bg-toss-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-toss-gray-900 dark:text-toss-gray-100">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-toss-gray-900 dark:text-toss-gray-100">야자 {record.period}차시</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-toss-gray-900 dark:text-toss-gray-100">{record.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-toss-gray-900 dark:text-toss-gray-100">{record.studentNumber}</td>
                    <td className="px-6 py-4 text-sm text-toss-gray-900 dark:text-toss-gray-100">{record.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
