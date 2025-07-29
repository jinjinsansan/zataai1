import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    // 既存のStripe顧客情報取得
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    const checkoutSession = await createCheckoutSession(
      session.user.id,
      subscription?.stripeCustomerId || undefined
    )

    return NextResponse.json({ url: checkoutSession.url })

  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json(
      { error: 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}