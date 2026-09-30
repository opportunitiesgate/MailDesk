import { NextResponse } from "next/server"
import { getProvisioningSteps, getRegistrationOwnerId, findRegistrationByOwner, runProvisioning } from "@/lib/registration"
import { getStripe } from "@/lib/stripe"

export async function GET(request: Request) {
  const ownerId = await getRegistrationOwnerId()
  if (!ownerId) return NextResponse.json({ error: "Registration session expired. Please start again." }, { status: 401 })
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session_id")
  if (sessionId) {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.payment_status === "paid" && session.metadata?.ownerId === ownerId) {
      await runProvisioning(ownerId)
    }
  }
  const setup = await findRegistrationByOwner(ownerId)
  if (!setup) return NextResponse.json({ error: "Registration setup not found." }, { status: 404 })
  return NextResponse.json({ status: setup.status, steps: await getProvisioningSteps(ownerId) })
}
