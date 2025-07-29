import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processChatMessage } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const { message } = await req.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'メッセージが入力されていません' },
        { status: 400 }
      )
    }

    const response = await processChatMessage(session.user.id, message)

    return NextResponse.json({ response })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'チャット処理でエラーが発生しました' },
      { status: 500 }
    )
  }
}