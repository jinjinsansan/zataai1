'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SubscriptionInfo {
  status: string
  trialEnd?: string
  currentPeriodEnd?: string
  stripeCustomerId?: string
  paypalOrderId?: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/subscription/info')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Subscription info fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStripeUpgrade = async () => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Stripe checkout error:', error)
      alert('決済画面の表示でエラーが発生しました')
    }
  }

  const handlePayPalUpgrade = async () => {
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    } catch (error) {
      console.error('PayPal checkout error:', error)
      alert('PayPal決済画面の表示でエラーが発生しました')
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'trial':
        return { text: '無料トライアル中', color: 'text-blue-600 bg-blue-100' }
      case 'active':
        return { text: 'アクティブ', color: 'text-green-600 bg-green-100' }
      case 'canceled':
        return { text: '解約済み', color: 'text-red-600 bg-red-100' }
      default:
        return { text: '不明', color: 'text-gray-600 bg-gray-100' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">アカウント設定</h1>
          
          {/* ユーザー情報 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">メールアドレス: </span>
                <span className="font-medium">{session?.user?.email}</span>
              </div>
              <div>
                <span className="text-gray-600">お名前: </span>
                <span className="font-medium">{session?.user?.name || '未設定'}</span>
              </div>
            </div>
          </div>

          {/* サブスクリプション情報 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">サブスクリプション</h2>
            {subscription && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600">状態: </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay(subscription.status).color}`}>
                    {getStatusDisplay(subscription.status).text}
                  </span>
                </div>
                
                {subscription.status === 'trial' && subscription.trialEnd && (
                  <div>
                    <span className="text-gray-600">トライアル終了日: </span>
                    <span className="font-medium">
                      {new Date(subscription.trialEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {subscription.status === 'active' && subscription.currentPeriodEnd && (
                  <div>
                    <span className="text-gray-600">次回請求日: </span>
                    <span className="font-medium">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {(subscription.status === 'trial' || subscription.status === 'canceled') && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-md font-medium text-gray-700 mb-2">決済方法を選択してください:</h3>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleStripeUpgrade}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          💳 クレジットカード (Stripe)
                        </button>
                        <button
                          onClick={handlePayPalUpgrade}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          🏦 PayPal
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      月額980円で競馬予想AIを利用できます
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ナビゲーション */}
          <div className="flex space-x-4 pt-6 border-t">
            <button
              onClick={() => router.push('/chat')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              チャットに戻る
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}