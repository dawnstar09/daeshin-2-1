import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: '대신고 2-5 - 클래스 관리',
  description: '대신고 2-5 반 학생들을 위한 스마트 클래스 관리 시스템',
  icons: {
    icon: '/icon.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
