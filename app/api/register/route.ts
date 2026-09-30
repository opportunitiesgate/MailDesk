import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { createRegistrationUser, ensureRegistrationIndexes } from "@/lib/registration"
import { getDatabase } from "@/lib/mongodb"

const schema = z.object({ firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60), email: z.string().email().max(200), password: z.string().min(8).max(128) })
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Please enter valid account details." }, { status: 400 }); await ensureRegistrationIndexes(); const db = await getDatabase(); const exists = await db.collection("users").findOne({ email: parsed.data.email.toLowerCase() }); if (exists) return NextResponse.json({ error: "Unable to create this account. Check the details or sign in." }, { status: 409 }); const result = await createRegistrationUser({ ...parsed.data, passwordHash: await bcrypt.hash(parsed.data.password, 12) }); return NextResponse.json({ userId: String(result.insertedId) }, { status: 201 }) }
