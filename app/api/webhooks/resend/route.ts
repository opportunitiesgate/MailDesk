import { Resend } from "resend"

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
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    },
    secret: process.env.RESEND_WEBHOOK_SECRET,
  })

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
