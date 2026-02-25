'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, push, remove, update } from 'firebase/database'
import { motion } from 'framer-motion'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'

interface Hagteugsa {
  id: string
  title: string
  description: string
  maxMembers: number
  date: string
  location: string
  creatorName: string
  creatorCode: string
  members: { [key: string]: { name: string; studentNumber: string; joinedAt: number } }
  createdAt: number
}

export default function HagteugsaPage() {
  const [activities, setActivities] = useState<Hagteugsa[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Hagteugsa | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxMembers: 10,
    date: '',
    location: '',
    creatorName: '',
    creatorCode: '',
  })

  const [joinData, setJoinData] = useState({
    name: '',
    studentNumber: '',
  })

  // Fetch data
  useEffect(() => {
    const activitiesRef = ref(database, 'hagteugsa')
    const unsubscribe = onValue(activitiesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const activitiesList = Object.entries(data).map(([id, activity]: [string, any]) => ({
          id,
          members: {},
          ...activity,
        }))
        setActivities(activitiesList)
      } else {
        setActivities([])
      }
    })

    return () => unsubscribe()
  }, [])

  // Create activity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 비밀번호 확인
    const password = prompt('활동을 생성하려면 비밀번호를 입력하세요:')
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      alert('비밀번호가 틀렸습니다.')
      return
    }
    
    const activitiesRef = ref(database, 'hagteugsa')
    await push(activitiesRef, {
      ...formData,
      members: {},
      createdAt: Date.now(),
    })

    setFormData({
      title: '',
      description: '',
      maxMembers: 10,
      date: '',
      location: '',
      creatorName: '',
      creatorCode: '',
    })
    setIsModalOpen(false)
  }

  // Join activity
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedActivity) return

    const memberRef = ref(database, `hagteugsa/${selectedActivity.id}/members`)
    await push(memberRef, {
      ...joinData,
      joinedAt: Date.now(),
    })

    setJoinData({ name: '', studentNumber: '' })
    setJoinModalOpen(false)
    setSelectedActivity(null)
  }

  // Delete activity
  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const activityRef = ref(database, `hagteugsa/${id}`)
      await remove(activityRef)
    }
  }

  // Open join modal
  const openJoinModal = (activity: Hagteugsa) => {
    setSelectedActivity(activity)
    setJoinModalOpen(true)
  }

  return (
    <div className="container-custom py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-2">학특사 🎯</h1>
            <p className="text-toss-gray-600 dark:text-toss-gray-300">학교 특색 사업 신청 및 관리</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            + 활동 만들기
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">전체 활동</div>
            <div className="text-2xl font-bold text-toss-blue">{activities.length}개</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">참여 가능</div>
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => Object.keys(a.members || {}).length < a.maxMembers).length}개
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-toss-gray-600 mb-1">총 참여 인원</div>
            <div className="text-2xl font-bold text-purple-600">
              {activities.reduce((sum, a) => sum + Object.keys(a.members || {}).length, 0)}명
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <div className="text-center text-toss-gray-500">
                <p className="text-lg mb-2">🎯</p>
                <p>등록된 활동이 없습니다</p>
              </div>
            </Card>
          </div>
        ) : (
          activities.map((activity, index) => {
            const memberCount = Object.keys(activity.members || {}).length
            const isFull = memberCount >= activity.maxMembers
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="p-6 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-toss-gray-900 flex-1">
                        {activity.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                        isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isFull ? '마감' : '모집중'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-toss-gray-600 mb-4 line-clamp-3">
                      {activity.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-toss-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{activity.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{activity.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{memberCount} / {activity.maxMembers}명</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>{activity.creatorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-toss-gray-200">
                    <Button
                      onClick={() => openJoinModal(activity)}
                      disabled={isFull}
                      className="flex-1 text-sm"
                    >
                      {isFull ? '마감됨' : '참여하기'}
                    </Button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="활동 만들기">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="활동 제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="예: 독서 토론 모임"
            required
          />
          <div>
            <label className="block text-sm font-medium text-toss-gray-700 mb-2">활동 설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="활동 설명을 입력하세요"
              className="input min-h-[100px] resize-none"
              required
            />
          </div>
          <Input
            type="number"
            label="최대 인원"
            value={formData.maxMembers}
            onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
            min={1}
            required
          />
          <Input
            label="활동 날짜"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            placeholder="예: 2026-03-15"
            required
          />
          <Input
            label="활동 장소"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="예: 도서관 2층"
            required
          />
          <Input
            label="주최자 이름"
            value={formData.creatorName}
            onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
            required
          />
          <Input
            label="주최자 코드"
            value={formData.creatorCode}
            onChange={(e) => setFormData({ ...formData, creatorCode: e.target.value })}
            placeholder="예: 205"
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">만들기</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              취소
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Modal */}
      <Modal 
        isOpen={joinModalOpen} 
        onClose={() => {
          setJoinModalOpen(false)
          setSelectedActivity(null)
        }} 
        title={`${selectedActivity?.title} 참여하기`}
      >
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="이름"
            value={joinData.name}
            onChange={(e) => setJoinData({ ...joinData, name: e.target.value })}
            required
          />
          <Input
            label="학번"
            value={joinData.studentNumber}
            onChange={(e) => setJoinData({ ...joinData, studentNumber: e.target.value })}
            placeholder="예: 5"
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">참여하기</Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setJoinModalOpen(false)
                setSelectedActivity(null)
              }} 
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
