import { NextResponse } from "next/server"
import { auth } from "../../../../auth"
import { getDatabase } from "../../../../lib/mongodb"

const modules = ["User", "Email", "Chat"] as const
const actions = ["manage", "read", "create", "update", "delete"] as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (session.user.role === "superadmin") {
    return NextResponse.json({ role: session.user.role, abilities: modules.flatMap((module) => actions.map((action) => ({ module, action }))) })
  }

  if (!session.user.organizationId) return NextResponse.json({ role: session.user.role, abilities: [] })
  const db = await getDatabase()
  const role = await db.collection("organization_roles").findOne({ organizationId: session.user.organizationId, name: session.user.role })
  const abilities = role?.abilities?.flatMap((ability: { module: string; actions: string[] }) => ability.actions.map((action) => ({ module: ability.module, action }))) ?? []
  return NextResponse.json({ role: session.user.role, abilities })
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

