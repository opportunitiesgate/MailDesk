import { createHmac, timingSafeEqual } from "crypto"
import { ObjectId } from "mongodb"
import { cookies } from "next/headers"

const REGISTRATION_COOKIE = "maildesk_registration"

function registrationSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not configured")
  return secret
}

export function createRegistrationToken(userId: string) {
  const signature = createHmac("sha256", registrationSecret()).update(userId).digest("hex")
  return `${userId}.${signature}`
}

export async function getRegistrationOwnerId() {
  const token = (await cookies()).get(REGISTRATION_COOKIE)?.value
  if (!token) return null
  const [userId, signature] = token.split(".")
  if (!ObjectId.isValid(userId) || !signature) return null
  const expected = createHmac("sha256", registrationSecret()).update(userId).digest("hex")
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  const db = await getDatabase()
  const user = await db.collection<RegistrationUser>("users").findOne({ _id: new ObjectId(userId), active: false })
  return user ? userId : null
}

export const registrationCookie = REGISTRATION_COOKIE

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
  return db.collection<RegistrationUser & { _id?: ObjectId; createdAt: Date }>("users").insertOne({ name: `${input.firstName} ${input.lastName}`, firstName: input.firstName, lastName: input.lastName, email: input.email.toLowerCase(), passwordHash: input.passwordHash, role: "admin", active: false, registrationStatus: "PENDING_ORGANIZATION_SETUP", createdAt: now })
}

export async function saveSetup(ownerId: string, input: { name: string; slug: string; planId?: PlanId }) {
  const db = await getDatabase(); const now = new Date(); const oid = new ObjectId(ownerId)
  const existing = await db.collection<Setup>("registration_setups").findOne({ ownerId: oid })
  const values = { name: input.name.trim(), slug: input.slug, ...(input.planId ? { planId: input.planId } : {}), status: input.planId ? "PAYMENT_PENDING" : "ORGANIZATION_INFO_COMPLETED", subdomain: `${input.slug}.${process.env.APP_DOMAIN || "opportunitiesgate.net"}`, updatedAt: now }
  if (existing) { await db.collection("registration_setups").updateOne({ _id: existing._id }, { $set: values }); return existing._id }
  const result = await db.collection("registration_setups").insertOne({ ownerId: oid, ...values, createdAt: now }); return result.insertedId
}

export async function createWorkspace(ownerId: string, planId: PlanId) {
  const db = await getDatabase()
  const setup = await findRegistrationByOwner(ownerId)
  if (!setup?._id) return null
  const org = await db.collection("organizations").findOneAndUpdate({ ownerId: new ObjectId(ownerId) }, { $setOnInsert: { name: setup.name, slug: setup.slug, ownerId: new ObjectId(ownerId), planId, active: false, status: "PROVISIONING", createdAt: new Date() }, $set: { planId, active: false, status: "PROVISIONING", updatedAt: new Date() } }, { upsert: true, returnDocument: "after" })
  await db.collection("registration_setups").updateOne({ _id: setup._id }, { $set: { status: "PROVISIONING", billingStatus: "active", updatedAt: new Date() } })
  return org
}

export async function completeSetup(ownerId: string, planId: PlanId) {
  const db = await getDatabase(); const setup = await findRegistrationByOwner(ownerId); if (!setup?._id) return null
  await db.collection("registration_setups").updateOne({ _id: setup._id }, { $set: { planId, status: "ACTIVE", billingStatus: "active", updatedAt: new Date() } })
  const org = await db.collection("organizations").findOneAndUpdate({ ownerId: new ObjectId(ownerId) }, { $setOnInsert: { name: setup.name, slug: setup.slug, ownerId: new ObjectId(ownerId), planId, active: true, status: "ACTIVE", createdAt: new Date() }, $set: { planId, active: true, status: "ACTIVE", updatedAt: new Date() } }, { upsert: true, returnDocument: "after" })
  await db.collection("users").updateOne({ _id: new ObjectId(ownerId) }, { $set: { organizationId: org?._id, registrationStatus: "ACTIVE", active: true } })
  return org
}

export async function publicSetup(ownerId: string) { const setup = await findRegistrationByOwner(ownerId); if (!setup) return null; return { ...setup, _id: String(setup._id), ownerId: String(setup.ownerId), plan: setup.planId ? PLANS[setup.planId] : null } }

export function publicPlans() { return Object.values(PLANS) }

export async function markProvisioningActive(ownerId: string) { const db = await getDatabase(); await db.collection("registration_setups").updateOne({ ownerId: new ObjectId(ownerId) }, { $set: { status: "ACTIVE", updatedAt: new Date() } }); await db.collection("users").updateOne({ _id: new ObjectId(ownerId) }, { $set: { registrationStatus: "ACTIVE" } }) }
export async function failProvisioning(ownerId: string, error: string) { const db = await getDatabase(); await db.collection("registration_setups").updateOne({ ownerId: new ObjectId(ownerId) }, { $set: { status: "PROVISIONING_FAILED", error: error.slice(0, 500), updatedAt: new Date() } }) }

type ProvisioningStepKey = "workspace" | "subdomain" | "email_domain" | "email_verification"

async function setProvisioningStep(ownerId: string, key: ProvisioningStepKey, status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED", error?: string) {
  const db = await getDatabase()
  await db.collection("provisioning_steps").updateOne(
    { ownerId: new ObjectId(ownerId), key },
    { $set: { ownerId: new ObjectId(ownerId), key, status, ...(error ? { error: error.slice(0, 500) } : {}), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  )
}

async function godaddyRequest(path: string, init: RequestInit = {}) {
  const key = process.env.GODADDY_API_KEY
  const secret = process.env.GODADDY_API_SECRET
  if (!key || !secret) throw new Error("GoDaddy credentials are not configured")
  const response = await fetch(`https://api.godaddy.com${path}`, { ...init, headers: { Authorization: `sso-key ${key}:${secret}`, "Content-Type": "application/json", ...(init.headers || {}) } })
  if (!response.ok) throw new Error(`GoDaddy request failed (${response.status})`)
  return response
}

async function provisionEmailDomain(ownerId: string, domain: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured")
  const create = await fetch("https://api.resend.com/domains", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: domain }) })
  const created = await create.json() as { id?: string; records?: Array<{ record: string; name: string; type: string; value: string; ttl?: number }> ; message?: string }
  if (!create.ok && !(create.status === 422 && created.message?.toLowerCase().includes("already"))) throw new Error(created.message || "Unable to create email domain")
  if (!created.id) {
    const list = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${resendKey}` } })
    const domains = await list.json() as { data?: Array<{ id: string; name: string; records?: typeof created.records }> }
    const existing = domains.data?.find((item) => item.name === domain)
    if (!existing) throw new Error("Email domain was not returned by Resend")
    created.id = existing.id; created.records = existing.records
  }
  const records = created.records || []
  const dnsRecords = records.filter((record) => record.record !== "MX").map((record) => ({ type: record.type, name: record.name.replace(`.${domain}`, "").replace(domain, "@") || "@", data: record.value, ttl: record.ttl || 3600 }))
  if (dnsRecords.length) await godaddyRequest(`/v1/domains/${process.env.APP_DOMAIN || "opportunitiesgate.net"}/records`, { method: "PATCH", body: JSON.stringify(dnsRecords) })
  await setProvisioningStep(ownerId, "email_domain", "COMPLETED")
  const verify = await fetch(`https://api.resend.com/domains/${created.id}/verify`, { method: "POST", headers: { Authorization: `Bearer ${resendKey}` } })
  if (!verify.ok && verify.status !== 400) throw new Error("Unable to verify email domain")
  await setProvisioningStep(ownerId, "email_verification", "COMPLETED")
}

export async function getProvisioningSteps(ownerId: string) {
  const db = await getDatabase()
  const rows = await db.collection("provisioning_steps").find({ ownerId: new ObjectId(ownerId) }).toArray()
  return ["workspace", "subdomain", "email_domain", "email_verification"].map((key) => rows.find((row) => row.key === key)?.status || "PENDING")
}

export async function runProvisioning(ownerId: string) {
  const setup = await findRegistrationByOwner(ownerId)
  if (!setup?.planId) return
  try {
    await setProvisioningStep(ownerId, "workspace", "IN_PROGRESS")
    await createWorkspace(ownerId, setup.planId)
    await setProvisioningStep(ownerId, "workspace", "COMPLETED")
    await setProvisioningStep(ownerId, "subdomain", "IN_PROGRESS")
    await godaddyRequest(`/v1/domains/${process.env.APP_DOMAIN || "opportunitiesgate.net"}/records`, { method: "PATCH", body: JSON.stringify([{ type: "CNAME", name: setup.slug, data: process.env.VERCEL_PROJECT_PRODUCTION_URL || "cname.vercel-dns.com", ttl: 3600 }]) })
    await setProvisioningStep(ownerId, "subdomain", "COMPLETED")
    await setProvisioningStep(ownerId, "email_domain", "IN_PROGRESS")
    await provisionEmailDomain(ownerId, setup.subdomain || `${setup.slug}.${process.env.APP_DOMAIN || "opportunitiesgate.net"}`)
    await markProvisioningActive(ownerId)
  } catch (error) {
    await failProvisioning(ownerId, error instanceof Error ? error.message : "Provisioning failed")
    throw error
  }
}

export function isPendingStatus(value?: string) { return value === "PENDING_ORGANIZATION_SETUP" || value === "PROVISIONING" || value === "PROVISIONING_FAILED" }

export type RegistrationStatus = "PENDING_ORGANIZATION_SETUP" | "PROVISIONING" | "PROVISIONING_FAILED" | "ACTIVE"

export async function ensureOwnerIndex() { const db = await getDatabase(); await db.collection("organizations").createIndex({ ownerId: 1 }, { unique: true, sparse: true }); await db.collection("organizations").createIndex({ slug: 1 }, { unique: true }) }

export const registrationError = (message: string, status = 400) => Response.json({ error: message }, { status })

export function sanitizeName(value: string) { return value.trim().replace(/\s+/g, " ") }

export function validPlan(value: unknown): value is PlanId { return typeof value === "string" && value in PLANS }

export function isValidName(value: string) { return value.length >= 2 && value.length <= 120 }

export function getProvisioningLabel(status: string) { return status === "ACTIVE" ? "Workspace ready" : status === "PROVISIONING_FAILED" ? "Needs attention" : "Setting up your workspace" }

export const PROVISIONING_STEPS = ["Workspace created", "Subdomain provisioned", "Email domain configured", "Email domain verified"] as const

export async function createPasswordResetToken(email: string) {
  const db = await getDatabase()
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await db.collection("password_reset_tokens").deleteMany({ email: email.toLowerCase() })
  await db.collection("password_reset_tokens").insertOne({ token, email: email.toLowerCase(), expiresAt, createdAt: new Date() })
  return token
}

export async function consumePasswordResetToken(token: string) {
  const db = await getDatabase()
  const record = await db.collection<{ token: string; email: string; expiresAt: Date }>("password_reset_tokens").findOneAndDelete({ token, expiresAt: { $gt: new Date() } })
  return record?.email ?? null
}
