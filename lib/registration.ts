import { ObjectId } from "mongodb"
import { getDatabase, type MailDeskUser } from "./mongodb"
import { PLANS, type PlanId } from "./plans"

export { PLANS, type PlanId } from "./plans"
export const RESERVED_SLUGS = new Set(["admin", "api", "app", "mail", "maildesk", "www", "support", "login", "register"])
export const normalizeSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
export const isValidSlug = (value: string) => /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/.test(value) && !RESERVED_SLUGS.has(value)

export type RegistrationUser = MailDeskUser & { firstName?: string; lastName?: string; registrationStatus?: string }
export type Setup = { _id?: ObjectId; ownerId: ObjectId; name: string; slug: string; planId?: PlanId; status: string; subdomain?: string; billingStatus?: string; createdAt: Date; updatedAt: Date }

export async function ensureRegistrationIndexes() {
  const db = await getDatabase()
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("registration_setups").createIndex({ ownerId: 1 }, { unique: true }),
    db.collection("registration_setups").createIndex({ slug: 1 }, { unique: true, sparse: true }),
    db.collection("provisioning_steps").createIndex({ ownerId: 1, key: 1 }, { unique: true }),
  ])
}

export async function findRegistrationByOwner(ownerId: string) {
  if (!ObjectId.isValid(ownerId)) return null
  const db = await getDatabase()
  return db.collection<Setup>("registration_setups").findOne({ ownerId: new ObjectId(ownerId) })
}

export async function createRegistrationUser(input: { firstName: string; lastName: string; email: string; passwordHash: string }) {
  const db = await getDatabase(); const now = new Date()
  return db.collection<RegistrationUser>("users").insertOne({ name: `${input.firstName} ${input.lastName}`, firstName: input.firstName, lastName: input.lastName, email: input.email.toLowerCase(), passwordHash: input.passwordHash, role: "admin", active: true, registrationStatus: "PENDING_ORGANIZATION_SETUP", createdAt: now } as RegistrationUser)
}

export async function saveSetup(ownerId: string, input: { name: string; slug: string; planId?: PlanId }) {
  const db = await getDatabase(); const now = new Date(); const oid = new ObjectId(ownerId)
  const existing = await db.collection<Setup>("registration_setups").findOne({ ownerId: oid })
  const values = { name: input.name.trim(), slug: input.slug, ...(input.planId ? { planId: input.planId } : {}), status: input.planId ? "PAYMENT_PENDING" : "ORGANIZATION_INFO_COMPLETED", subdomain: `${input.slug}.${process.env.APP_DOMAIN || "maildesk.local"}`, updatedAt: now }
  if (existing) { await db.collection("registration_setups").updateOne({ _id: existing._id }, { $set: values }); return existing._id }
  const result = await db.collection("registration_setups").insertOne({ ownerId: oid, ...values, createdAt: now }); return result.insertedId
}

export async function completeSetup(ownerId: string, planId: PlanId) {
  const db = await getDatabase(); const setup = await findRegistrationByOwner(ownerId); if (!setup?._id) return null
  await db.collection("registration_setups").updateOne({ _id: setup._id }, { $set: { planId, status: "PAYMENT_CONFIRMED", billingStatus: "active", updatedAt: new Date() } })
  const org = await db.collection("organizations").findOneAndUpdate({ ownerId: new ObjectId(ownerId) }, { $setOnInsert: { name: setup.name, slug: setup.slug, ownerId: new ObjectId(ownerId), planId, active: false, status: "PROVISIONING", createdAt: new Date() }, $set: { updatedAt: new Date() } }, { upsert: true, returnDocument: "after" })
  await db.collection("users").updateOne({ _id: new ObjectId(ownerId) }, { $set: { organizationId: org?._id, registrationStatus: "PROVISIONING" } })
  return org
}

export async function publicSetup(ownerId: string) { const setup = await findRegistrationByOwner(ownerId); if (!setup) return null; return { ...setup, _id: String(setup._id), ownerId: String(setup.ownerId), plan: setup.planId ? PLANS[setup.planId] : null } }

export function publicPlans() { return Object.values(PLANS) }

export async function markProvisioningActive(ownerId: string) { const db = await getDatabase(); await db.collection("registration_setups").updateOne({ ownerId: new ObjectId(ownerId) }, { $set: { status: "ACTIVE", updatedAt: new Date() } }); await db.collection("users").updateOne({ _id: new ObjectId(ownerId) }, { $set: { registrationStatus: "ACTIVE" } }) }
export async function failProvisioning(ownerId: string, error: string) { const db = await getDatabase(); await db.collection("registration_setups").updateOne({ ownerId: new ObjectId(ownerId) }, { $set: { status: "PROVISIONING_FAILED", error: error.slice(0, 500), updatedAt: new Date() } }) }

export async function runProvisioning(ownerId: string) { const setup = await findRegistrationByOwner(ownerId); if (!setup?.planId) return; await completeSetup(ownerId, setup.planId); }

export function isPendingStatus(value?: string) { return value === "PENDING_ORGANIZATION_SETUP" || value === "PROVISIONING" || value === "PROVISIONING_FAILED" }

export type RegistrationStatus = "PENDING_ORGANIZATION_SETUP" | "PROVISIONING" | "PROVISIONING_FAILED" | "ACTIVE"

export async function ensureOwnerIndex() { const db = await getDatabase(); await db.collection("organizations").createIndex({ ownerId: 1 }, { unique: true, sparse: true }); await db.collection("organizations").createIndex({ slug: 1 }, { unique: true }) }

export const registrationError = (message: string, status = 400) => Response.json({ error: message }, { status })

export function sanitizeName(value: string) { return value.trim().replace(/\s+/g, " ") }

export function validPlan(value: unknown): value is PlanId { return typeof value === "string" && value in PLANS }

export function isValidName(value: string) { return value.length >= 2 && value.length <= 120 }

export function getProvisioningLabel(status: string) { return status === "ACTIVE" ? "Workspace ready" : status === "PROVISIONING_FAILED" ? "Needs attention" : "Setting up your workspace" }

export const PROVISIONING_STEPS = ["Workspace created", "Subdomain provisioned", "Email domain configured", "Email domain verified"] as const
