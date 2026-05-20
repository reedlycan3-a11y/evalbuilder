import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: any
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const customerId = session.customer
    const subscriptionId = session.subscription
    const priceId = session.metadata?.price_id

    const planoMap: Record<string, string> = {
      [process.env.STRIPE_PRICE_STARTER!]: 'starter',
      [process.env.STRIPE_PRICE_PRO!]: 'pro',
      [process.env.STRIPE_PRICE_COMBO!]: 'combo',
    }
    const plano = planoMap[priceId] ?? 'starter'

    await supabase.from('profiles')
      .update({ plano, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId })
      .eq('stripe_customer_id', customerId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase.from('profiles')
      .update({ plano: 'starter' })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
