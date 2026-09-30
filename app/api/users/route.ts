import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../auth"
import { createManagedUser, createActivationToken, generatePassword, listManagedUsers, normalizeRole, safeUser, canManageRole } from "../../../lib/users"
import { getDatabase } from "../../../lib/mongodb"
import bcrypt from "bcryptjs"
import { Resend } from "resend"

const userSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), role: z.string().default("client") })

export async function GET() {
  const session = await auth()
  if (!session?.user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await listManagedUsers()
  return NextResponse.json(users.map(safeUser))
}

export async function POST(request: Request) {
  const session = await auth()
  const actorRole = session?.user?.role
  if (!actorRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = userSchema.safeParse(await request.json())
  const role = parsed.success ? normalizeRole(parsed.data.role) : null
  if (!parsed.success || !role || !canManageRole(actorRole, role)) return NextResponse.json({ error: "Invalid user details or insufficient permissions" }, { status: 400 })
  const email = parsed.data.email.toLowerCase()
  const db = await getDatabase()
  const existing = await db.collection("users").findOne({ email })
  if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  const password = await generatePassword()
  const { token, tokenHash } = createActivationToken()
  const id = await createManagedUser({ name: parsed.data.name, email, role, passwordHash: await bcrypt.hash(password, 12), activationTokenHash: tokenHash })
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || new URL(request.url).origin
  const activationUrl = `${baseUrl}/activate/${token}`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const templateId = role === "admin"
    ? process.env.RESEND_ADMIN_WELCOME_TEMPLATE_ID
    : process.env.RESEND_USER_ACTIVATION_TEMPLATE_ID
  const emailPayload = templateId
    ? {
        from: process.env.RESEND_FROM_EMAIL || "Mail Desk <onboarding@resend.dev>",
        to: [email],
        template: {
          id: templateId,
          variables: {
            NAME: parsed.data.name,
            ROLE: role,
            ACTIVATION_URL: activationUrl,
            TEMPORARY_PASSWORD: password,
          },
        },
      }
    : {
        from: process.env.RESEND_FROM_EMAIL || "Mail Desk <onboarding@resend.dev>",
        to: [email],
        subject: role === "admin" ? "Welcome to Mail Desk" : "Activate your Mail Desk account",
        html: `<p>Hi ${parsed.data.name},</p><p>Your Mail Desk account has been created with the <strong>${role}</strong> role.</p><p><a href="${activationUrl}">Activate your account</a></p><p>For security, your temporary password is: <strong>${password}</strong></p>`,
      }
  const { data: sentEmail, error } = await resend.emails.send(emailPayload, { idempotencyKey: `user-invitation/${id}` })
  if (sentEmail?.id) await db.collection("email_events").insertOne({ emailId: sentEmail.id, type: "email.sent", recipient: email, userId: id, createdAt: new Date() })
  if (error) return NextResponse.json({ error: "User created, but invitation email could not be sent" }, { status: 502 })
  return NextResponse.json({ id: String(id), emailId: sentEmail?.id, message: "User created and invitation sent" }, { status: 201 })
}
