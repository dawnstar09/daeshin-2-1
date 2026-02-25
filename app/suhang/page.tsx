'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, push, remove, update } from 'firebase/database'
import { motion } from 'framer-motion'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import { format, parseISO, isBefore, isAfter, addDays } from 'date-fns'

interface Assessment {
  id: string
  subject: string
  title: string
  description: string
  dueDate: string
  maxScore: number
  weight: number
  category: string
  createdAt: number
}

export default function SuhangPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    weight: 100,
    category: 'assignment',
  })

  // Fetch data from Firebase
  useEffect(() => {
    const assessmentRef = ref(database, 'assessments')
    const unsubscribe = onValue(assessmentRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const assessmentsList = Object.entries(data).map(([id, assessment]: [string, any]) => ({
          id,
          ...assessment,
        }))
        // Sort by due date
        assessmentsList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        setAssessments(assessmentsList)
      } else {
        setAssessments([])
      }
    })

    return () => unsubscribe()
  }, [])

  // Add or update assessment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 비밀번호 확인 (수정이 아닐 때만)
    if (!editingId) {
      const password = prompt('수행평가를 추가하려면 비밀번호를 입력하세요:')
      if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        alert('비밀번호가 틀렸습니다.')
        return
      }
    }
    
    if (editingId) {
      // Update existing
      const assessmentRef = ref(database, `assessments/${editingId}`)
      await update(assessmentRef, formData)
    } else {
      // Add new
      const assessmentRef = ref(database, 'assessments')
      await push(assessmentRef, {
        ...formData,
        createdAt: Date.now(),
      })
    }

    resetForm()
  }

  // Delete assessment
  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const assessmentRef = ref(database, `assessments/${id}`)
      await remove(assessmentRef)
    }
  }

  // Edit assessment
  const handleEdit = (assessment: Assessment) => {
    setFormData({
      subject: assessment.subject,
      title: assessment.title,
      description: assessment.description,
      dueDate: assessment.dueDate,
      maxScore: assessment.maxScore,
      weight: assessment.weight,
      category: assessment.category,
    })
    setEditingId(assessment.id)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      subject: '',
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
      weight: 100,
      category: 'assignment',
    })
    setEditingId(null)
    setIsModalOpen(false)
  }

  // Filter assessments
  const filteredAssessments = filterCategory === 'all' 
    ? assessments 
    : assessments.filter(a => a.category === filterCategory)

  // Categorize assessments
  const today = new Date()
  const upcoming = filteredAssessments.filter(a => {
    const dueDate = parseISO(a.dueDate)
    return isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 7))
  })
  const thisWeek = filteredAssessments.filter(a => {
    const dueDate = parseISO(a.dueDate)
    return isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 7))
  })
  const overdue = filteredAssessments.filter(a => isBefore(parseISO(a.dueDate), today))

  // Get category label
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      assignment: '과제',
      presentation: '발표',
      experiment: '실험',
      report: '보고서',
      test: '시험',
      other: '기타',
    }
    return labels[category] || category
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      assignment: 'bg-blue-100 text-blue-700',
      presentation: 'bg-purple-100 text-purple-700',
      experiment: 'bg-green-100 text-green-700',
      report: 'bg-orange-100 text-orange-700',
      test: 'bg-red-100 text-red-700',
      other: 'bg-gray-100 text-gray-700',
    }
    return colors[category] || colors.other
  }

  // Get due date status
  const getDueDateStatus = (dueDate: string) => {
    const due = parseISO(dueDate)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return { text: '기한 만료', color: 'text-red-600' }
    if (diff === 0) return { text: 'D-Day', color: 'text-red-600' }
    if (diff <= 3) return { text: `D-${diff}`, color: 'text-orange-600' }
    if (diff <= 7) return { text: `D-${diff}`, color: 'text-yellow-600' }
    return { text: `D-${diff}`, color: 'text-toss-gray-600' }
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-2">수행평가 📝</h1>
            <p className="text-toss-gray-600 dark:text-toss-gray-300">수행평가 일정 관리</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            + 평가 추가
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">전체 평가</div>
            <div className="text-2xl font-bold text-toss-blue">{assessments.length}개</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">이번 주</div>
            <div className="text-2xl font-bold text-yellow-600">{thisWeek.length}개</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">임박</div>
            <div className="text-2xl font-bold text-orange-600">{upcoming.length}개</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">기한 만료</div>
            <div className="text-2xl font-bold text-red-600">{overdue.length}개</div>
          </Card>
        </div>

        {/* Filter */}
        <Card className="p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'assignment', 'presentation', 'experiment', 'report', 'test', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-toss-blue text-white'
                    : 'bg-toss-gray-100 text-toss-gray-700 hover:bg-toss-gray-200'
                }`}
              >
                {cat === 'all' ? '전체' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Assessments List */}
      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-toss-gray-500">
              <p className="text-lg mb-2">📝</p>
              <p>등록된 수행평가가 없습니다</p>
            </div>
          </Card>
        ) : (
          filteredAssessments.map((assessment, index) => {
            const status = getDueDateStatus(assessment.dueDate)
            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(assessment.category)}`}>
                          {getCategoryLabel(assessment.category)}
                        </span>
                        <span className={`font-bold ${status.color}`}>
                          {status.text}
                        </span>
                        <span className="text-sm text-toss-gray-500">
                          {format(parseISO(assessment.dueDate), 'yyyy-MM-dd')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-toss-gray-900 mb-1">
                        [{assessment.subject}] {assessment.title}
                      </h3>
                      <p className="text-toss-gray-600 mb-3">{assessment.description}</p>
                      <div className="flex gap-4 text-sm text-toss-gray-500">
                        <span>배점: {assessment.maxScore}점</span>
                        <span>반영 비율: {assessment.weight}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(assessment)}
                        className="px-3 py-1 text-sm text-toss-blue hover:bg-toss-blue-light rounded-lg transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(assessment.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={editingId ? '수행평가 수정' : '수행평가 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="과목"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="예: 수학"
            required
          />
          <Input
            label="평가 제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="예: 수학 탐구 보고서"
            required
          />
          <div>
            <label className="block text-sm font-medium text-toss-gray-700 mb-2">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="평가 설명을 입력하세요"
              className="input min-h-[100px] resize-none"
              required
            />
          </div>
          <Input
            type="date"
            label="마감일"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="배점"
              value={formData.maxScore}
              onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
              min={1}
              required
            />
            <Input
              type="number"
              label="반영 비율 (%)"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
              min={1}
              max={100}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-toss-gray-700 mb-2">카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              <option value="assignment">과제</option>
              <option value="presentation">발표</option>
              <option value="experiment">실험</option>
              <option value="report">보고서</option>
              <option value="test">시험</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingId ? '수정하기' : '추가하기'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              취소
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
