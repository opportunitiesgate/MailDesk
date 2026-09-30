import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  const session = await auth()
  if (!session?.user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["superadmin", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Mailing access required" }, { status: 403 })

  const db = await getDatabase()
  const organizationId = session.user.role === "superadmin" ? undefined : session.user.organizationId
  if (session.user.role === "admin" && !organizationId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 })
  }
  const events = await db.collection("mailing_webhooks").find(organizationId ? { organizationId } : {}).sort({ createdAt: -1 }).limit(100).toArray()
  return NextResponse.json(events.map(({ _id, payload, ...event }) => ({ id: String(_id), ...event, payload })))
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
