import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../auth"
import { canManageUser, deleteManagedUser, getManagedUserRole, normalizeRole, updateManagedUser } from "../../../../lib/users"

const updateSchema = z.object({ name: z.string().trim().min(2).max(100).optional(), email: z.string().email().optional(), role: z.string().optional(), active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0)

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const actorRole = session?.user?.role
  if (!actorRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (actorRole !== "superadmin") return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  const { id } = await params
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid user details" }, { status: 400 })
  const role = parsed.data.role ? normalizeRole(parsed.data.role) : undefined
  if (parsed.data.role && !role) return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  if (role && !canManageUser(actorRole, role)) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  const update: { name?: string; email?: string; role?: "superadmin" | "admin" | "client"; active?: boolean } = {
    name: parsed.data.name,
    email: parsed.data.email,
    active: parsed.data.active,
    ...(role ? { role } : {}),
  }
  const updated = await updateManagedUser(id, update)
  return updated ? NextResponse.json({ message: "User updated" }) : NextResponse.json({ error: "User not found" }, { status: 404 })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const actorRole = session?.user?.role
  if (!actorRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (actorRole !== "superadmin") return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  const { id } = await params
  const targetRole = await getManagedUserRole(id)
  if (!targetRole) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!canManageUser(actorRole, targetRole)) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  const deleted = await deleteManagedUser(id)
  return deleted ? NextResponse.json({ message: "User deleted" }) : NextResponse.json({ error: "User not found" }, { status: 404 })
}
