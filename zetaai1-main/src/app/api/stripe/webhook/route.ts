import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) return

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'active',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
    }
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string }
  })

  if (subscription) {
    await prisma.payment.create({
      data: {
        userId: subscription.userId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        stripePaymentIntentId: invoice.payment_intent as string,
        description: `月額料金 - ${new Date().toISOString().slice(0, 7)}`
      }
    })
  }
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: stripeSubscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    }
  })
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: 'canceled'
    }
  })
}