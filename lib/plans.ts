export const PLANS = {
  free: { id: "free", name: "Free", price: 0, description: "For getting started" },
  starter: { id: "starter", name: "Starter", price: 19, description: "For small teams" },
  pro: { id: "pro", name: "Pro", price: 49, description: "For growing teams" },
  business: { id: "business", name: "Business", price: 99, description: "For larger organizations" },
} as const
export type PlanId = keyof typeof PLANS
