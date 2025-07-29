import { NextRequest, NextResponse } from 'next/server'
import { captureSubscription, getSubscription } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headers = req.headers

  try {
    // PayPal Webhook検証（簡易版）
    // 本番環境では適切な署名検証が必要
    
    const event = JSON.parse(body)
    
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event)
        break
        
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event)
        break
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event)
        break
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event)
        break
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleOrderApproved(event: any) {
  const orderId = event.resource.id
  
  try {
    // オーダーをキャプチャ
    const capture = await captureSubscription(orderId)
    
    // サブスクリプション情報を更新
    await prisma.subscription.updateMany({
      where: { 
        paypalOrderId: orderId 
      },
      data: {
        status: 'active',
        paypalSubscriptionId: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      }
    })
  } catch (error) {
    console.error('Order approved handling error:', error)
  }
}

async function handlePaymentCompleted(event: any) {
  const paymentId = event.resource.id
  const amount = event.resource.amount.value
  
  try {
    // 支払い履歴を保存
    await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        currency: event.resource.amount.currency_code,
        status: 'succeeded',
        paypalPaymentId: paymentId,
        description: `PayPal月額料金 - ${new Date().toISOString().slice(0, 7)}`
      }
    })
  } catch (error) {
    console.error('Payment completed handling error:', error)
  }
}

async function handleSubscriptionActivated(event: any) {
  const subscriptionId = event.resource.id
  
  try {
    const subscription = await getSubscription(subscriptionId)
    
    await prisma.subscription.updateMany({
      where: { 
        paypalSubscriptionId: subscriptionId 
      },
      data: {
        status: 'active',
        currentPeriodEnd: new Date(subscription.billing_info?.next_billing_time || Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  } catch (error) {
    console.error('Subscription activated handling error:', error)
  }
}

async function handleSubscriptionCancelled(event: any) {
  const subscriptionId = event.resource.id
  
  try {
    await prisma.subscription.updateMany({
      where: { 
        paypalSubscriptionId: subscriptionId 
      },
      data: {
        status: 'canceled'
      }
    })
  } catch (error) {
    console.error('Subscription cancelled handling error:', error)
  }
}