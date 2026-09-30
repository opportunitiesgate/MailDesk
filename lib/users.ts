import { createHash, randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { getDatabase, type MailDeskUser, type UserRole } from "./mongodb"

export type ManagedUser = Omit<MailDeskUser, "passwordHash"> & { _id: unknown; createdAt?: Date; invitedAt?: Date; activatedAt?: Date }

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createActivationToken() {
  const token = randomBytes(32).toString("hex")
  return { token, tokenHash: hashToken(token) }
}

export async function listManagedUsers(organizationId?: string) {
  const db = await getDatabase()
  const filter = organizationId ? { organizationId } : {}
  return db.collection<ManagedUser>("users").find(filter, { projection: { passwordHash: 0, activationTokenHash: 0 } }).sort({ createdAt: -1 }).toArray()
}

export async function createManagedUser(input: { name: string; email: string; deliveryEmail: string; role: UserRole; organizationId?: string; passwordHash: string; activationTokenHash?: string; active?: boolean }) {
  const db = await getDatabase()
  const now = new Date()
  const result = await db.collection("users").insertOne({
    name: input.name,
    email: input.email.toLowerCase(),
    deliveryEmail: input.deliveryEmail.toLowerCase(),
    passwordHash: input.passwordHash,
    role: input.role,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    active: input.active ?? false,
    ...(input.activationTokenHash ? { activationTokenHash: input.activationTokenHash } : {}),
    invitedAt: now,
    createdAt: now,
  })
  return result.insertedId
}

export async function updateManagedUser(id: string, input: { name?: string; email?: string; role?: string; active?: boolean }, organizationId?: string) {
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  if (!ObjectId.isValid(id)) return false
  const result = await db.collection("users").updateOne({ _id: new ObjectId(id), ...(organizationId ? { organizationId } : {}) }, { $set: { ...input, ...(input.email ? { email: input.email.toLowerCase() } : {}), updatedAt: new Date() } })
  return result.matchedCount > 0
}

export async function getManagedUserRole(id: string, organizationId?: string) {
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  if (!ObjectId.isValid(id)) return null
  const user = await db.collection<Pick<MailDeskUser, "role">>("users").findOne({ _id: new ObjectId(id), ...(organizationId ? { organizationId } : {}) }, { projection: { role: 1 } })
  return user?.role ?? null
}

export async function deleteManagedUser(id: string, organizationId?: string) {
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  if (!ObjectId.isValid(id)) return false
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id), ...(organizationId ? { organizationId } : {}) })
  return result.deletedCount > 0
}

export async function activateManagedUser(token: string, password: string) {
  const db = await getDatabase()
  const user = await db.collection<MailDeskUser & { activationTokenHash?: string }>("users").findOne({ activationTokenHash: hashToken(token), active: false })
  if (!user?._id) return false
  await db.collection("users").updateOne({ _id: user._id }, { $set: { active: true, passwordHash: await bcrypt.hash(password, 12), activatedAt: new Date() }, $unset: { activationTokenHash: "" } })
  return true
}

export async function generatePassword() {
  return randomBytes(12).toString("base64url")
}

export function safeUser(user: ManagedUser) {
  return { ...user, _id: String(user._id) }
}

export function canManageRole(actor: UserRole, target: UserRole) {
  return actor === "superadmin" || (actor === "admin" && target === "client")
}

export function canManageUser(actor: UserRole, target: UserRole) {
  return actor === "superadmin" || (actor === "admin" && target !== "superadmin")
}

export function normalizeRole(role: string): UserRole | null {
  return role.trim().length >= 2 && role.trim().length <= 60 ? role.trim() : null
}
