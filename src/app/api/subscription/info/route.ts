import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'サブスクリプション情報が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)

  } catch (error) {
    console.error('Subscription info error:', error)
    return NextResponse.json(
      { error: 'サブスクリプション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}