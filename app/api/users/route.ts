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
  const isEmployee = role === "admin"
  const activation = isEmployee ? null : createActivationToken()
  const id = await createManagedUser({
    name: parsed.data.name,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 12),
    ...(activation ? { activationTokenHash: activation.tokenHash } : {}),
    active: isEmployee,
  })
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || new URL(request.url).origin
  const activationUrl = activation ? `${baseUrl}/activate/${activation.token}` : `${baseUrl}/login`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const event = isEmployee ? "maildesk-employee-welcome" : "client-welcome-activation"
  const { error } = await resend.events.send({
    event,
    email,
    payload: {
      name: parsed.data.name,
      email,
      password,
      ...(isEmployee ? { login_url: activationUrl } : { activation_url: activationUrl }),
    },
  })
  if (error) return NextResponse.json({ error: "User created, but the welcome event could not be sent" }, { status: 502 })
  return NextResponse.json({ id: String(id), message: "User created and welcome email queued" }, { status: 201 })
}
