import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { getDatabase } from "../../../../../lib/mongodb"

const roleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  abilities: z.array(z.object({
    module: z.enum(["User", "Email", "Chat"]),
    actions: z.array(z.enum(["manage", "read", "create", "update", "delete"])).min(1),
  })).default([]),
})

async function canAccessOrganization(id: string) {
  const session = await auth()
  if (!session?.user?.role) return { session: null, allowed: false }
  if (session.user.role === "superadmin") return { session, allowed: true }
  return { session, allowed: session.user.role === "admin" && session.user.organizationId === id }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const access = await canAccessOrganization(id)
  if (!access.session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!access.allowed) return NextResponse.json({ error: "Organization access denied" }, { status: 403 })
  const db = await getDatabase()
  const roles = await db.collection("organization_roles").find({ organizationId: id }).sort({ name: 1 }).toArray()
  return NextResponse.json(roles)
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const access = await canAccessOrganization(id)
  if (!access.session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!access.allowed) return NextResponse.json({ error: "Organization access denied" }, { status: 403 })
  const parsed = roleSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid role details" }, { status: 400 })
  const db = await getDatabase()
  const result = await db.collection("organization_roles").insertOne({ organizationId: id, ...parsed.data, createdAt: new Date(), updatedAt: new Date() })
  return NextResponse.json({ id: String(result.insertedId), organizationId: id, ...parsed.data }, { status: 201 })
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
