import { Resend } from "resend"
import { getDatabase } from "@/lib/mongodb"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  return new Resend(apiKey)
}

export async function POST(request: Request) {
  const resend = getResendClient()
  const payload = await request.text()
  const event = resend.webhooks.verify({
    payload,
    headers: {
      id: request.headers.get("svix-id") ?? "",
      timestamp: request.headers.get("svix-timestamp") ?? "",
      signature: request.headers.get("svix-signature") ?? "",
    },
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
  })

  const db = await getDatabase()
  const eventData = event.data as { email_id?: string }
  const eventId = eventData.email_id ?? `${event.type}:${event.created_at}`
  await db.collection("mailing_webhooks").updateOne(
    { eventId },
    { $set: { eventId, type: event.type, payload: event.data, createdAt: new Date(event.created_at) } },
    { upsert: true },
  )

  if (event.type === "email.received") {
    const { data: email, error } = await resend.emails.receiving.get(event.data.email_id)
    if (error) {
      console.error("[resend-webhook] Failed to retrieve received email", error)
      return Response.json({ error: "Unable to process received email" }, { status: 502 })
    }
    console.info("[resend-webhook] Received email", { id: email?.id, from: email?.from })
  }

  return Response.json({ received: true })
}

export function GET() {
  return Response.json({ status: "ok", endpoint: "resend-webhook" })
}
