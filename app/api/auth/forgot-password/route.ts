import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"
import { createPasswordResetToken } from "@/lib/registration"
import { getDatabase } from "@/lib/mongodb"

const schema = z.object({ email: z.string().email().max(200) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  const email = parsed.data.email.toLowerCase()
  const db = await getDatabase()
  const user = await db.collection("users").findOne({ email, active: true })
  if (user) {
    const token = await createPasswordResetToken(email)
    const origin = new URL(request.url).origin
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "MailDesk <noreply@opportunitiesgate.net>",
      to: [email],
      subject: "Reset your MailDesk password",
      html: `<p>We received a request to reset your MailDesk password.</p><p><a href="${origin}/reset-password?token=${encodeURIComponent(token)}">Reset your password</a></p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`,
    }, { idempotencyKey: `password-reset/${String(user._id)}/${token}` })
    if (result.error) return NextResponse.json({ error: "Unable to send the reset email right now." }, { status: 503 })
  }
  return NextResponse.json({ message: "If an active account exists for that email, a reset link has been sent." })
}
