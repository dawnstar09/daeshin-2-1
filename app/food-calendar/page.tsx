'use client'

import { useState, useEffect, useRef } from 'react'
import { database, storage } from '@/lib/firebase'
import { ref as dbRef, onValue, set, remove } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { motion } from 'framer-motion'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import { format } from 'date-fns'
import { fetchMealInfo, cleanMenuText, formatDateForNeis } from '@/lib/neisApi'

interface LunchMenu {
  menu: string
  calories: string
  updatedAt: number
}

interface DinnerImage {
  url: string
  uploadedAt: number
}

export default function FoodCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [lunchMenu, setLunchMenu] = useState<LunchMenu | null>(null)
  const [dinnerImage, setDinnerImage] = useState<DinnerImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // NEIS API에서 중식 정보 가져오기
  useEffect(() => {
    const loadLunchMenu = async () => {
      setLoading(true)
      try {
        const dateStr = formatDateForNeis(selectedDate)
        const meals = await fetchMealInfo(dateStr)
        
        // 중식(코드 2) 찾기
        const lunch = meals.find(meal => meal.MMEAL_SC_CODE === '2')
        
        if (lunch) {
          const menu = cleanMenuText(lunch.DDISH_NM)
          const calories = lunch.CAL_INFO
          setLunchMenu({ menu, calories, updatedAt: Date.now() })
        } else {
          setLunchMenu(null)
        }
      } catch (error) {
        setLunchMenu(null)
      } finally {
        setLoading(false)
      }
    }

    loadLunchMenu()
  }, [selectedDate])

  // Firebase에서 석식 사진 가져오기
  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    const dinnerRef = dbRef(database, `dinner_images/${dateKey}`)
    
    const unsubscribe = onValue(dinnerRef, (snapshot) => {
      const data = snapshot.val()
      setDinnerImage(data || null)
    })

    return () => unsubscribe()
  }, [selectedDate])

  // 날짜 변경
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  // 석식 사진 업로드
  const handleUploadDinner = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    setLoading(true)
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd')
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const fileName = `${dateKey}.${fileExtension}`
      
      // 기존 이미지 삭제 (있으면)
      if (dinnerImage) {
        try {
          const oldImageRef = storageRef(storage, `dinner_images/${dateKey}`)
          await deleteObject(oldImageRef)
        } catch {}
      }

      // 새 이미지 업로드
      const imageRef = storageRef(storage, `dinner_images/${fileName}`)
      await uploadBytes(imageRef, file)
      const url = await getDownloadURL(imageRef)

      // Firebase Database에 URL 저장
      const dinnerRef = dbRef(database, `dinner_images/${dateKey}`)
      await set(dinnerRef, {
        url,
        uploadedAt: Date.now()
      })

      setUploadModalOpen(false)
      alert('석식 사진이 업로드되었습니다!')
    } catch {
      alert('사진 업로드에 실패했습니다. Firebase Storage가 활성화되어 있는지 확인하세요.')
    } finally {
      setLoading(false)
    }
  }

  // 석식 사진 삭제
  const handleDeleteDinner = async () => {
    if (!confirm('석식 사진을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd')
      
      // Storage에서 이미지 삭제
      if (dinnerImage?.url) {
        try {
          // URL에서 파일 경로 추출
          const imagePath = dinnerImage.url.split('/o/')[1]?.split('?')[0]
          if (imagePath) {
            const decodedPath = decodeURIComponent(imagePath)
            const imageRef = storageRef(storage, decodedPath)
            await deleteObject(imageRef)
          }
        } catch {}
      }

      // Database에서 정보 삭제
      const dinnerRef = dbRef(database, `dinner_images/${dateKey}`)
      await remove(dinnerRef)

      alert('석식 사진이 삭제되었습니다!')
    } catch {
      alert('사진 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-toss-gray-900 dark:text-toss-gray-50 mb-2">급식표 🍱</h1>
        <p className="text-toss-gray-600 dark:text-toss-gray-300">NEIS 중식 정보와 석식 사진을 확인하세요</p>
      </motion.div>

      {/* 날짜 선택 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-toss-gray-900 dark:text-toss-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-toss-gray-900 dark:text-toss-gray-50">
              {format(selectedDate, 'yyyy년 M월 d일')}
            </div>
            <div className="text-sm text-toss-gray-600 dark:text-toss-gray-300">
              {['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][selectedDate.getDay()]}
            </div>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-toss-gray-900 dark:text-toss-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setSelectedDate(new Date())}
          className="w-full text-center text-sm text-toss-blue hover:underline"
        >
          오늘로 이동
        </button>
      </Card>

      {/* 중식 정보 (NEIS API) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-toss-gray-900 dark:text-toss-gray-50">🍚 중식</h2>
            <span className="text-xs text-toss-gray-500 dark:text-toss-gray-400">NEIS 급식정보</span>
          </div>
          {loading ? (
            <div className="text-center py-8 text-toss-gray-500 dark:text-toss-gray-400">
              로딩 중...
            </div>
          ) : lunchMenu ? (
            <div>
              <div className="space-y-2 mb-4">
                {lunchMenu.menu.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 py-2 px-4 bg-toss-gray-50 dark:bg-toss-gray-700/50 rounded-lg hover:bg-toss-blue-light dark:hover:bg-toss-blue/10 transition-colors"
                  >
                    <span className="text-toss-blue font-bold mt-0.5">•</span>
                    <span className="text-toss-gray-800 dark:text-toss-gray-200 flex-1">
                      {line.trim()}
                    </span>
                  </div>
                ))}
              </div>
              {lunchMenu.calories && (
                <div className="flex items-center gap-2 text-sm text-toss-gray-600 dark:text-toss-gray-400 mt-3 pt-3 border-t border-toss-gray-200 dark:border-toss-gray-600 bg-toss-gray-50 dark:bg-toss-gray-700/30 rounded-lg px-4 py-2">
                  <span className="text-lg">💡</span>
                  <span className="font-medium">{lunchMenu.calories}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-toss-gray-500 dark:text-toss-gray-400">
              급식 정보가 없습니다
            </div>
          )}
        </Card>
      </motion.div>

      {/* 석식 사진 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-toss-gray-900 dark:text-toss-gray-50">🌙 석식</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setUploadModalOpen(true)}
                variant="secondary"
                size="small"
              >
                {dinnerImage ? '변경' : '업로드'}
              </Button>
              {dinnerImage && (
                <Button
                  onClick={handleDeleteDinner}
                  variant="secondary"
                  size="small"
                  disabled={loading}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
          {dinnerImage ? (
            <div className="relative">
              <img
                src={dinnerImage.url}
                alt="석식 사진"
                className="w-full rounded-xl object-cover max-h-96"
              />
              <div className="text-xs text-toss-gray-500 dark:text-toss-gray-400 mt-2">
                업로드: {new Date(dinnerImage.uploadedAt).toLocaleString('ko-KR')}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-toss-gray-50 dark:bg-toss-gray-800 rounded-xl">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-toss-gray-300 dark:text-toss-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-toss-gray-500 dark:text-toss-gray-400">석식 사진이 없습니다</p>
              <p className="text-sm text-toss-gray-400 dark:text-toss-gray-500 mt-1">
                업로드 버튼을 눌러 사진을 추가하세요
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* 업로드 모달 */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="석식 사진 업로드"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-toss-gray-700 dark:text-toss-gray-300 mb-2">
              사진 선택
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="w-full text-sm text-toss-gray-500 dark:text-toss-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-toss-blue file:text-white
                hover:file:bg-blue-600
                file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-toss-gray-500 dark:text-toss-gray-400 mt-2">
              JPG, PNG, GIF 등 이미지 파일만 업로드 가능합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const file = fileInputRef.current?.files?.[0]
                if (file) {
                  handleUploadDinner(file)
                } else {
                  alert('파일을 선택해주세요')
                }
              }}
              disabled={loading}
              className="flex-1"
            >
              {loading ? '업로드 중...' : '업로드'}
            </Button>
            <Button
              onClick={() => setUploadModalOpen(false)}
              variant="secondary"
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
