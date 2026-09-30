import { Resend } from "resend"
import { getDatabase } from "../../../../lib/mongodb"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured")
  return new Resend(apiKey)
}

export async function POST(request: Request) {
  const resend = getResendClient()
  const payload = await request.text()

  let event
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      },
      secret: process.env.RESEND_WEBHOOK_SECRET,
    })
  } catch (error) {
    console.error("[resend-webhook] Invalid signature", error)
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  const db = await getDatabase()
  const eventData = event.data as Record<string, unknown>
  await db.collection("email_events").updateOne(
    { webhookId: request.headers.get("svix-id"), type: event.type },
    { $set: { webhookId: request.headers.get("svix-id"), type: event.type, data: eventData, receivedAt: new Date() } },
    { upsert: true },
  )

  if (event.type === "email.received") {
    const { data: email, error } = await resend.emails.receiving.get(String(eventData.email_id))
    if (error || !email) {
      console.error("[resend-webhook] Failed to retrieve received email", error)
      return Response.json({ error: "Unable to process received email" }, { status: 502 })
    }
    await db.collection("inbox_messages").updateOne(
      { resendEmailId: email.id },
      { $set: { resendEmailId: email.id, from: email.from, to: email.to, cc: email.cc, subject: email.subject, text: email.text, html: email.html, receivedAt: new Date(), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), status: "unread" } },
      { upsert: true },
    )
  }

  return Response.json({ received: true })
}

export function GET() {
  return Response.json({ status: "ok", endpoint: "resend-webhook" })
}
