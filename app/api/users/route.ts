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
  const isClient = role === "client"
  const { token, tokenHash } = createActivationToken()
  const id = await createManagedUser({
    name: parsed.data.name,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 12),
    activationTokenHash: isClient ? tokenHash : "",
  })

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || new URL(request.url).origin
  const loginUrl = process.env.MAILDESK_LOGIN_URL || `${baseUrl}/login`
  const activationUrl = `${baseUrl}/activate/${token}`
  if (!isClient) await db.collection("users").updateOne({ _id: id }, { $set: { active: true }, $unset: { activationTokenHash: "" } })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const event = isClient ? "client-welcome-activation" : "maildesk-employee-welcome"
  const payload = isClient
    ? { name: parsed.data.name, email, password, activation_url: activationUrl }
    : { name: parsed.data.name, email, password, login_url: loginUrl }
  const { data: sentEvent, error } = await resend.events.send({ event, email, payload })

  await db.collection("email_events").insertOne({
    type: error ? "email.event_failed" : "email.event.sent",
    event,
    recipient: email,
    userId: id,
    providerId: sentEvent?.id,
    error: error?.message,
    createdAt: new Date(),
  })
  if (error) return NextResponse.json({ error: "User created, but the welcome event could not be sent" }, { status: 502 })
  return NextResponse.json({ id: String(id), eventId: sentEvent?.id, message: "User created and welcome event sent" }, { status: 201 })
}
