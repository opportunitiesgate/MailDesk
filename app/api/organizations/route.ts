import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../auth"
import { getDatabase } from "../../../lib/mongodb"

const organizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  const organizationId = session.user.organizationId
  const filter = session.user.role === "superadmin" ? {} : organizationId && ObjectId.isValid(organizationId) ? { _id: new ObjectId(organizationId) } : { _id: { $exists: false } }
  const organizations = await db.collection("organizations").find(filter).sort({ name: 1 }).toArray()
  return NextResponse.json(organizations)
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "superadmin") return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  const parsed = organizationSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid organization details" }, { status: 400 })
  const db = await getDatabase()
  const existing = await db.collection("organizations").findOne({ slug: parsed.data.slug })
  if (existing) return NextResponse.json({ error: "Organization slug already exists" }, { status: 409 })
  const now = new Date()
  const result = await db.collection("organizations").insertOne({ ...parsed.data, active: true, createdAt: now, updatedAt: now })
  return NextResponse.json({ id: String(result.insertedId), ...parsed.data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "superadmin") return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Organization id is required" }, { status: 400 })
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid organization id" }, { status: 400 })
  await db.collection("organizations").updateOne({ _id: new ObjectId(id) }, { $set: { active: false, updatedAt: new Date() } })
  return NextResponse.json({ message: "Organization deactivated" })
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
