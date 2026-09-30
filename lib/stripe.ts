import Stripe from "stripe"

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error("Stripe is not configured")
  return new Stripe(secret, { apiVersion: "2025-03-31.basil" })
}

export const stripePriceIds = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
} as const

export function stripeIsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getAppUrl() {
  return process.env.APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || "http://localhost:3000"
}

export async function createPlanCheckout(input: { ownerId: string; email: string; planId: "starter" | "pro" | "business"; setupId: string }) {
  if (!stripeIsConfigured()) throw new Error("Stripe is not configured")
  const price = stripePriceIds[input.planId]
  if (!price) throw new Error(`Stripe price is not configured for ${input.planId}`)
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email,
    line_items: [{ price, quantity: 1 }],
    metadata: { ownerId: input.ownerId, setupId: input.setupId, planId: input.planId },
    subscription_data: { metadata: { ownerId: input.ownerId, setupId: input.setupId, planId: input.planId } },
    success_url: `${getAppUrl()}/register?step=4&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/register?step=3`,
  }, { idempotencyKey: `registration-checkout/${input.setupId}/${input.planId}` })
}

export async function createFreeSubscription(input: { ownerId: string; email: string; setupId: string }) {
  if (!stripeIsConfigured()) throw new Error("Stripe is not configured")
  const customer = await getStripe().customers.create({ email: input.email, metadata: { ownerId: input.ownerId, setupId: input.setupId } })
  const product = await getStripe().products.create({ name: "MailDesk Free", metadata: { setupId: input.setupId } })
  const price = await getStripe().prices.create({ product: product.id, currency: "usd", unit_amount: 0, recurring: { interval: "month" } })
  return getStripe().subscriptions.create({ customer: customer.id, items: [{ price: price.id }], metadata: { ownerId: input.ownerId, setupId: input.setupId, planId: "free" } }, { idempotencyKey: `registration-free/${input.setupId}` })
}
