import paypal from '@paypal/checkout-server-sdk'

// PayPal環境設定
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)

const client = new paypal.core.PayPalHttpClient(environment)

export { client }

// サブスクリプションプランの作成
export async function createSubscription(userId: string) {
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer("return=representation")
  request.requestBody({
    intent: 'SUBSCRIPTION',
    application_context: {
      return_url: `${process.env.NEXTAUTH_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings?canceled=true`,
    },
    purchase_units: [{
      amount: {
        currency_code: 'JPY',
        value: '980'
      },
      description: '競馬予想AI 月額サブスクリプション'
    }],
    plan_id: process.env.PAYPAL_PLAN_ID
  })

  try {
    const order = await client.execute(request)
    return order.result
  } catch (error) {
    console.error('PayPal order creation error:', error)
    throw error
  }
}

// サブスクリプションのキャプチャ
export async function captureSubscription(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId)
  request.prefer("return=representation")

  try {
    const capture = await client.execute(request)
    return capture.result
  } catch (error) {
    console.error('PayPal capture error:', error)
    throw error
  }
}

// サブスクリプションの詳細取得
export async function getSubscription(subscriptionId: string) {
  const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId)

  try {
    const subscription = await client.execute(request)
    return subscription.result
  } catch (error) {
    console.error('PayPal subscription get error:', error)
    throw error
  }
}

// サブスクリプションのキャンセル
export async function cancelSubscription(subscriptionId: string) {
  const request = new paypal.subscriptions.SubscriptionsCancelRequest(subscriptionId)
  request.requestBody({
    reason: 'User requested cancellation'
  })

  try {
    await client.execute(request)
    return true
  } catch (error) {
    console.error('PayPal subscription cancel error:', error)
    throw error
  }
}