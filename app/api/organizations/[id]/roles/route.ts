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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const access = await canAccessOrganization(id)
  if (!access.session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!access.allowed) return NextResponse.json({ error: "Organization access denied" }, { status: 403 })
  const roleId = new URL(request.url).searchParams.get("roleId")
  if (!roleId) return NextResponse.json({ error: "Role id is required" }, { status: 400 })
  const parsed = roleSchema.partial().safeParse(await request.json())
  if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Invalid role details" }, { status: 400 })
  const db = await getDatabase()
  const result = await db.collection("organization_roles").updateOne(
    { _id: new (await import("mongodb")).ObjectId(roleId), organizationId: id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
  )
  if (!result.matchedCount) return NextResponse.json({ error: "Role not found" }, { status: 404 })
  return NextResponse.json({ message: "Role updated" })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const access = await canAccessOrganization(id)
  if (!access.session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!access.allowed) return NextResponse.json({ error: "Organization access denied" }, { status: 403 })
  const roleId = new URL(request.url).searchParams.get("roleId")
  if (!roleId) return NextResponse.json({ error: "Role id is required" }, { status: 400 })
  const db = await getDatabase()
  const result = await db.collection("organization_roles").deleteOne({ _id: new (await import("mongodb")).ObjectId(roleId), organizationId: id })
  if (!result.deletedCount) return NextResponse.json({ error: "Role not found" }, { status: 404 })
  return NextResponse.json({ message: "Role deleted" })
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
