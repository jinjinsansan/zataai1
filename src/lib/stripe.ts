import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export const PRICE_ID = process.env.STRIPE_PRICE_ID! // 月額プランのPriceID

export async function createCheckoutSession(userId: string, customerId?: string) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXTAUTH_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings?canceled=true`,
    metadata: {
      userId
    }
  })

  return session
}