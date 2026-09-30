import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { consumePasswordResetToken } from "@/lib/registration"
import { getDatabase } from "@/lib/mongodb"

const schema = z.object({ token: z.string().min(20), password: z.string().min(8).max(128) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Use a valid token and a password with at least 8 characters." }, { status: 400 })
  const email = await consumePasswordResetToken(parsed.data.token)
  if (!email) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 })
  const db = await getDatabase()
  await db.collection("users").updateOne({ email, active: true }, { $set: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } })
  return NextResponse.json({ message: "Password updated. You can now sign in." })
}
