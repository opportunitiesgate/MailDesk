import { NextResponse } from "next/server"
import { z } from "zod"
import { activateManagedUser } from "../../../../lib/users"

export async function POST(request: Request) {
  const parsed = z.object({ token: z.string().min(32), password: z.string().min(8).max(128) }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  const activated = await activateManagedUser(parsed.data.token, parsed.data.password)
  return activated ? NextResponse.json({ message: "Account activated" }) : NextResponse.json({ error: "Invalid or expired activation link" }, { status: 400 })
}
