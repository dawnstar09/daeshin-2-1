'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, push, remove, update } from 'firebase/database'
import { motion } from 'framer-motion'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'

interface AbsentRecord {
  id: string
  studentNumber: number
  date: string
  period: number
  reason: string
  createdAt: number
}

export default function YajaAttendancePage() {
  // Get today's date in local timezone (YYYY-MM-DD)
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [selectedPeriod, setSelectedPeriod] = useState(1)
  const [absentRecords, setAbsentRecords] = useState<AbsentRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [reasonType, setReasonType] = useState('학원')
  const [reasonDetail, setReasonDetail] = useState('')

  // Fetch absent records
  useEffect(() => {
    const yajaRef = ref(database, 'yaja_students')
    const unsubscribe = onValue(yajaRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const recordsList: AbsentRecord[] = Object.entries(data).map(([id, record]: [string, any]) => ({
          id,
          studentNumber: parseInt(record.studentNumber),
          date: record.date,
          period: record.period,
          reason: record.reason,
          createdAt: record.createdAt,
        }))
        setAbsentRecords(recordsList)
      } else {
        setAbsentRecords([])
      }
    })

    return () => unsubscribe()
  }, [])

  // Check if student is absent
  const isStudentAbsent = (studentNum: number): AbsentRecord | undefined => {
    return absentRecords.find(
      r => r.studentNumber === studentNum && 
           r.date === selectedDate && 
           r.period === selectedPeriod
    )
  }

  // Handle box click
  const handleBoxClick = (studentNum: number) => {
    const existingRecord = isStudentAbsent(studentNum)
    if (existingRecord) {
      // Parse existing reason
      const reason = existingRecord.reason
      if (reason.startsWith('동아리: ')) {
        setReasonType('동아리')
        setReasonDetail(reason.substring(5))
      } else if (reason.startsWith('활동: ')) {
        setReasonType('활동')
        setReasonDetail(reason.substring(4))
      } else if (['학원', '병원', '방과후'].includes(reason)) {
        setReasonType(reason)
        setReasonDetail('')
      } else {
        setReasonType('기타')
        setReasonDetail(reason)
      }
    } else {
      setReasonType('학원')
      setReasonDetail('')
    }
    setSelectedStudent(studentNum)
    setIsModalOpen(true)
  }

  // Save/Update absence
  const handleSave = async () => {
    if (!selectedStudent) return

    // Build final reason string
    let finalReason = ''
    if (reasonType === '동아리') {
      if (!reasonDetail.trim()) {
        alert('동아리 이름을 입력해주세요.')
        return
      }
      finalReason = `동아리: ${reasonDetail.trim()}`
    } else if (reasonType === '활동') {
      if (!reasonDetail.trim()) {
        alert('활동 장소를 입력해주세요.')
        return
      }
      finalReason = `활동: ${reasonDetail.trim()}`
    } else if (reasonType === '기타') {
      if (!reasonDetail.trim()) {
        alert('기타 사유를 입력해주세요.')
        return
      }
      finalReason = reasonDetail.trim()
    } else {
      finalReason = reasonType
    }

    const existingRecord = isStudentAbsent(selectedStudent)

    if (existingRecord) {
      // Update existing record
      const recordRef = ref(database, `yaja_students/${existingRecord.id}`)
      await update(recordRef, {
        reason: finalReason,
      })
    } else {
      // Create new record
      const yajaRef = ref(database, 'yaja_students')
      await push(yajaRef, {
        date: selectedDate,
        period: selectedPeriod,
        studentName: `학생${selectedStudent}`,
        studentCode: '205',
        studentNumber: selectedStudent.toString(),
        reason: finalReason,
        createdAt: Date.now(),
      })
    }

    setIsModalOpen(false)
    setSelectedStudent(null)
    setReasonType('학원')
    setReasonDetail('')
  }

  // Delete absence record
  const handleDelete = async () => {
    if (!selectedStudent) return

    const existingRecord = isStudentAbsent(selectedStudent)
    if (existingRecord) {
      const recordRef = ref(database, `yaja_students/${existingRecord.id}`)
      await remove(recordRef)
    }

    setIsModalOpen(false)
    setSelectedStudent(null)
    setReasonType('학원')
    setReasonDetail('')
  }

  // Get stats
  const todayAbsent = absentRecords.filter(
    r => r.date === selectedDate && r.period === selectedPeriod
  ).length

  const totalStudents = 36
  const presentStudents = totalStudents - todayAbsent

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-2">야자 출석 체크 ✅</h1>
        <p className="text-toss-gray-600 dark:text-toss-gray-300">
          오늘 날짜 기준 학생 박스를 클릭하여 불참 사유를 입력하세요
        </p>
        <p className="text-sm text-toss-gray-500 dark:text-toss-gray-400 mt-1">
          💡 과거 기록 조회는 야자 통계 페이지에서 확인할 수 있습니다
        </p>
      </motion.div>

      {/* Controls */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-toss-gray-700 dark:text-toss-gray-300 mb-2">오늘 날짜</label>
            <div className="px-4 py-2 bg-toss-gray-50 dark:bg-toss-gray-700 rounded-xl font-medium text-toss-gray-900 dark:text-toss-gray-50">
              {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-toss-gray-700 dark:text-toss-gray-300 mb-2">차시</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>야자 1차시</option>
              <option value={2}>야자 2차시</option>
              <option value={3}>야자 3차시</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full">
              <div className="text-sm font-medium text-toss-gray-700 dark:text-toss-gray-300 mb-2">출석 현황</div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium text-toss-gray-900 dark:text-toss-gray-50">출석 {presentStudents}명</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm font-medium text-toss-gray-900 dark:text-toss-gray-50">불참 {todayAbsent}명</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Student Grid */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-4">학생 출석부 (1-36번)</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-3">
          {Array.from({ length: totalStudents }, (_, i) => i + 1).map((studentNum) => {
            const absentRecord = isStudentAbsent(studentNum)
            const isAbsent = !!absentRecord

            return (
              <motion.button
                key={studentNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBoxClick(studentNum)}
                className={`
                  aspect-square rounded-xl font-bold text-lg
                  transition-all duration-200 shadow-sm hover:shadow-md
                  ${isAbsent 
                    ? 'bg-red-500 text-white ring-2 ring-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                  }
                `}
                title={isAbsent ? `불참 사유: ${absentRecord.reason}` : '출석'}
              >
                {studentNum}
              </motion.button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-toss-gray-200">
          <div className="flex items-center gap-6 text-sm text-toss-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
              <span>출석 (클릭하여 불참 처리)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg ring-2 ring-red-600"></div>
              <span>불참 (클릭하여 사유 확인/수정)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Absent List */}
      {todayAbsent > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="p-6">
            <h3 className="text-lg font-bold text-toss-gray-900 mb-4">
              불참 학생 목록 ({todayAbsent}명)
            </h3>
            <div className="space-y-2">
              {absentRecords
                .filter(r => r.date === selectedDate && r.period === selectedPeriod)
                .sort((a, b) => a.studentNumber - b.studentNumber)
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold">
                        {record.studentNumber}
                      </div>
                      <div>
                        <div className="font-medium text-toss-gray-900">
                          {record.studentNumber}번 학생
                        </div>
                        <div className="text-sm text-toss-gray-600">
                          사유: {record.reason}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBoxClick(record.studentNumber)}
                      className="px-3 py-1 text-sm text-toss-blue hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      수정
                    </button>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modal for Adding/Editing Absence */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedStudent(null)
          setReasonType('학원')
          setReasonDetail('')
        }}
        title={`${selectedStudent}번 학생 불참 처리`}
      >
        <div className="space-y-4">
          <div className="bg-toss-gray-50 dark:bg-toss-gray-700 p-4 rounded-xl">
            <div className="text-sm text-toss-gray-600 dark:text-toss-gray-400 mb-1">학생 번호</div>
            <div className="text-3xl font-bold text-toss-gray-900 dark:text-toss-gray-50">{selectedStudent}번</div>
          </div>

          <div className="bg-toss-blue-light dark:bg-toss-blue/20 p-4 rounded-xl">
            <div className="text-sm text-toss-gray-700 dark:text-toss-gray-300 mb-1">날짜 및 차시</div>
            <div className="font-medium text-toss-gray-900 dark:text-toss-gray-50">
              {selectedDate} / 야자 {selectedPeriod}차시
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-toss-gray-700 dark:text-toss-gray-300 mb-2">
              불참 사유 {isStudentAbsent(selectedStudent || 0) ? '(수정)' : '(신규 입력)'}
            </label>
            <select
              value={reasonType}
              onChange={(e) => {
                setReasonType(e.target.value)
                setReasonDetail('')
              }}
              className="input mb-3"
            >
              <option value="학원">학원</option>
              <option value="병원">병원</option>
              <option value="방과후">방과후</option>
              <option value="동아리">동아리 (어떤 동아리인지 작성)</option>
              <option value="활동">활동 (어디서 하는지 작성)</option>
              <option value="기타">기타</option>
            </select>

            {/* Additional input for specific types */}
            {(reasonType === '동아리' || reasonType === '활동' || reasonType === '기타') && (
              <input
                type="text"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder={
                  reasonType === '동아리' ? '동아리 이름을 입력하세요' :
                  reasonType === '활동' ? '활동 장소를 입력하세요' :
                  '기타 사유를 입력하세요'
                }
                className="input"
                autoFocus
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              className="flex-1"
            >
              {isStudentAbsent(selectedStudent || 0) ? '수정하기' : '불참 처리'}
            </Button>
            {isStudentAbsent(selectedStudent || 0) && (
              <Button 
                onClick={handleDelete} 
                variant="secondary"
                className="flex-1 !bg-red-100 !text-red-700 hover:!bg-red-200"
              >
                출석 처리
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
