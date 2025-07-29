import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // 1週間無料トライアル付与
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'trial',
        trialEnd
      }
    })

    return NextResponse.json({ 
      message: 'アカウントが作成されました。1週間の無料トライアルが開始されます。' 
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'アカウント作成に失敗しました' },
      { status: 500 }
    )
  }
}