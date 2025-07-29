import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSubscription } from '@/lib/paypal'
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

    // PayPalサブスクリプション作成
    const order = await createSubscription(session.user.id)

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: order.links?.find(link => link.rel === 'approve')?.href
    })

  } catch (error) {
    console.error('PayPal order creation error:', error)
    return NextResponse.json(
      { error: 'PayPal決済の作成に失敗しました' },
      { status: 500 }
    )
  }
}