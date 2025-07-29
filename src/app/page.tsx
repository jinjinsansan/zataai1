'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // ログイン済みの場合はチャット画面へ
    router.push('/chat')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🏇 競馬予想AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AIが過去データを分析して、今日のレースを予想します
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI予想</h3>
              <p className="text-gray-600">過去データと独自指数で高精度な予想を提供</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">チャット形式</h3>
              <p className="text-gray-600">自然な会話で気軽に予想を聞けます</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">詳細分析</h3>
              <p className="text-gray-600">指数の根拠となるデータも確認可能</p>
            </div>
          </div>

          <div className="space-x-4">
            <Link 
              href="/auth/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              無料で始める
            </Link>
            <Link 
              href="/auth/signin"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              ログイン
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            1週間無料トライアル / その後月額980円
          </p>
        </div>
      </div>
    </div>
  )
}