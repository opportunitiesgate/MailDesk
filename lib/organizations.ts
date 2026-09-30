import { getDatabase } from "./mongodb"

export type AbilityAction = "manage" | "read" | "create" | "update" | "delete"
export type ModuleName = "user" | "email" | "chat"

export type OrganizationRole = {
  _id?: unknown
  organizationId: string
  name: string
  description?: string
  abilities: Array<{ module: ModuleName; actions: AbilityAction[] }>
  createdAt: Date
  updatedAt?: Date
}

export type Organization = {
  _id?: unknown
  name: string
  slug: string
  active: boolean
  createdAt: Date
  updatedAt?: Date
}

export async function listOrganizations() {
  const db = await getDatabase()
  return db.collection<Organization>("organizations").find({ active: true }).sort({ name: 1 }).toArray()
}

export async function createOrganization(name: string) {
  const db = await getDatabase()
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const now = new Date()
  const result = await db.collection<Organization>("organizations").insertOne({ name: name.trim(), slug, active: true, createdAt: now })
  return result.insertedId
}

export async function listOrganizationRoles(organizationId: string) {
  const db = await getDatabase()
  return db.collection<OrganizationRole>("organization_roles").find({ organizationId }).sort({ name: 1 }).toArray()
}

export async function createOrganizationRole(input: Omit<OrganizationRole, "_id" | "createdAt">) {
  const db = await getDatabase()
  const now = new Date()
  const result = await db.collection<OrganizationRole>("organization_roles").insertOne({ ...input, createdAt: now })
  return result.insertedId
}

export function publicOrganization(value: Organization | OrganizationRole) {
  return { ...value, _id: String(value._id) }
}

export function defaultAbilities() {
  return [
    { module: "user" as const, actions: ["read" as const] },
    { module: "email" as const, actions: ["read" as const] },
    { module: "chat" as const, actions: ["read" as const] },
  ]
}

export async function ensureOrganizationIndexes() {
  const db = await getDatabase()
  await db.collection("organizations").createIndex({ slug: 1 }, { unique: true })
  await db.collection("organization_roles").createIndex({ organizationId: 1, name: 1 }, { unique: true })
}

export function canAccessOrganization(actor: { role?: string; organizationId?: string }, organizationId: string) {
  return actor.role === "superadmin" || actor.organizationId === organizationId
}

export function safeOrganization(value: Organization | OrganizationRole) {
  return publicOrganization(value)
}

export { createOrganization as createManagedOrganization }
export { listOrganizations as listManagedOrganizations }
export { listOrganizationRoles as listManagedOrganizationRoles }
export { createOrganizationRole as createManagedOrganizationRole }

export type { OrganizationRole as ManagedOrganizationRole }

export const modules: ModuleName[] = ["user", "email", "chat"]
export const actions: AbilityAction[] = ["manage", "read", "create", "update", "delete"]

export function isModule(value: string): value is ModuleName { return modules.includes(value as ModuleName) }
export function isAction(value: string): value is AbilityAction { return actions.includes(value as AbilityAction) }

export async function findOrganization(id: string) {
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  if (!ObjectId.isValid(id)) return null
  return db.collection<Organization>("organizations").findOne({ _id: new ObjectId(id), active: true })
}

export async function seedOrganizationRole(organizationId: string, name = "Member") {
  return createOrganizationRole({ organizationId, name, abilities: defaultAbilities() })
}

export function toOrganizationId(value: unknown) { return value ? String(value) : undefined }

export function organizationPayload(value: Organization) { return { ...safeOrganization(value), _id: String(value._id) } }

export function rolePayload(value: OrganizationRole) { return { ...safeOrganization(value), _id: String(value._id) } }

export function uniqueAbilities(abilities: OrganizationRole["abilities"]) {
  return abilities.filter((item, index, list) => list.findIndex((candidate) => candidate.module === item.module) === index)
}

export function organizationRoleSchema(input: unknown) {
  return input as { name?: string; description?: string; abilities?: OrganizationRole["abilities"] }
}

export function normalizeOrganizationName(value: string) { return value.trim().replace(/\s+/g, " ") }

export function isValidOrganizationName(value: string) { return value.trim().length >= 2 && value.trim().length <= 120 }

export function isValidRoleName(value: string) { return value.trim().length >= 2 && value.trim().length <= 80 }

export function scopedOrganizationFilter(actor: { role?: string; organizationId?: string }) {
  return actor.role === "superadmin" ? {} : { _id: actor.organizationId }
}

export function scopedUserFilter(actor: { role?: string; organizationId?: string }) {
  return actor.role === "superadmin" ? {} : { organizationId: actor.organizationId }
}

export function scopedRoleFilter(actor: { role?: string; organizationId?: string }, organizationId: string) {
  return actor.role === "superadmin" ? { organizationId } : { organizationId: actor.organizationId }
}

export const organizationModules = modules
export const organizationActions = actions

export function isOrganizationAdmin(role?: string) { return role === "admin" || role === "superadmin" }

export function canManageOrganization(actorRole?: string) { return actorRole === "superadmin" }

export function canManageOrganizationRoles(actor: { role?: string; organizationId?: string }, organizationId: string) {
  return actor.role === "superadmin" || (actor.role === "admin" && actor.organizationId === organizationId)
}

export function canCreateOrganizationUser(actor: { role?: string; organizationId?: string }, organizationId: string) {
  return canManageOrganizationRoles(actor, organizationId)
}

export function serializeDate(value?: Date) { return value?.toISOString() }

export function publicRole(value: OrganizationRole) { return rolePayload(value) }

export function publicOrg(value: Organization) { return organizationPayload(value) }

export function roleAbilities(value?: OrganizationRole) { return value?.abilities ?? defaultAbilities() }

export function hasAbility(role: OrganizationRole | undefined, module: ModuleName, action: AbilityAction) {
  return role?.abilities.some((ability) => ability.module === module && (ability.actions.includes(action) || ability.actions.includes("manage"))) ?? false
}

export function organizationSlug(name: string) { return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }

export const organizationCollection = "organizations"
export const organizationRoleCollection = "organization_roles"

export function isSuperAdmin(role?: string) { return role === "superadmin" }

export function isAdmin(role?: string) { return role === "admin" }

export function isClient(role?: string) { return role === "client" }

export function safeId(value: unknown) { return String(value) }

export function trimOptional(value?: string) { return value?.trim() || undefined }

export function normalizeAbilities(value: unknown) { return Array.isArray(value) ? value : defaultAbilities() }

export function normalizeOrganizationId(value?: string) { return value?.trim() || undefined }

export function normalizeRoleName(value: string) { return value.trim() }

export function isActiveOrganization(value?: Organization | null) { return Boolean(value?.active) }

export function roleCanManageUsers(role: string | undefined) { return role === "admin" || role === "superadmin" }

export function roleCanManageEmails(role: OrganizationRole | undefined) { return hasAbility(role, "email", "manage") }

export function roleCanManageChat(role: OrganizationRole | undefined) { return hasAbility(role, "chat", "manage") }

export function roleCanManageUserModule(role: OrganizationRole | undefined) { return hasAbility(role, "user", "manage") }

export function organizationMembership(organizationId?: string) { return organizationId ? { organizationId } : {} }

export function omitSecrets<T extends Record<string, unknown>>(value: T) { const { passwordHash, activationTokenHash, ...safe } = value; return safe }

export function roleName(value?: string) { return value?.trim() || "Member" }

export function organizationName(value?: string) { return value?.trim() || "Organization" }

export function canSeeAllOrganizations(role?: string) { return role === "superadmin" }

export function canSeeOrganization(actor: { role?: string; organizationId?: string }, organizationId: string) { return canAccessOrganization(actor, organizationId) }

export function canEditRole(actor: { role?: string; organizationId?: string }, organizationId: string) { return canManageOrganizationRoles(actor, organizationId) }

export function canDeleteRole(actor: { role?: string; organizationId?: string }, organizationId: string) { return canManageOrganizationRoles(actor, organizationId) }

export function canCreateRole(actor: { role?: string; organizationId?: string }, organizationId: string) { return canManageOrganizationRoles(actor, organizationId) }

export function canCreateOrganization(actorRole?: string) { return actorRole === "superadmin" }

export function canDeleteOrganization(actorRole?: string) { return actorRole === "superadmin" }

export function canEditOrganization(actorRole?: string) { return actorRole === "superadmin" }

export function canReadOrganization(actorRole?: string) { return actorRole === "superadmin" || actorRole === "admin" }

export function canManageSystem(actorRole?: string) { return actorRole === "superadmin" }

export function isOrganizationScoped(actorRole?: string) { return actorRole !== "superadmin" }

export function normalizeOrganization(value?: string) { return value?.trim() || undefined }

export function validateAbilities(abilities: unknown) { return Array.isArray(abilities) && abilities.every((item) => item && typeof item.module === "string" && Array.isArray(item.actions)) }

export function roleDocument(organizationId: string, name: string, abilities: OrganizationRole["abilities"], description?: string) { return { organizationId, name, abilities, ...(description ? { description } : {}) } }

export function organizationDocument(name: string) { return { name: normalizeOrganizationName(name), slug: organizationSlug(name), active: true, createdAt: new Date() } }

export function mapIds<T extends { _id?: unknown }>(values: T[]) { return values.map((value) => ({ ...value, _id: String(value._id) })) }

export function organizationMap(values: Organization[]) { return mapIds(values) }

export function roleMap(values: OrganizationRole[]) { return mapIds(values) }

export function normalizeOrganizationResponse(value: Organization) { return organizationPayload(value) }

export function normalizeRoleResponse(value: OrganizationRole) { return rolePayload(value) }

export function getModules() { return [...modules] }

export function getActions() { return [...actions] }

export function roleHasModule(role: OrganizationRole | undefined, module: ModuleName) { return role?.abilities.some((ability) => ability.module === module) ?? false }

export function roleHasAction(role: OrganizationRole | undefined, module: ModuleName, action: AbilityAction) { return hasAbility(role, module, action) }

export function isValidModule(value: string) { return isModule(value) }

export function isValidAction(value: string) { return isAction(value) }

export function ensureString(value: unknown) { return typeof value === "string" ? value : "" }

export function ensureArray<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : [] }

export function organizationDisplayName(value: Organization) { return value.name }

export function roleDisplayName(value: OrganizationRole) { return value.name }

export function organizationRoleKey(value: OrganizationRole) { return `${value.organizationId}:${value.name}` }

export function organizationKey(value: Organization) { return value.slug }

export function roleModules(value: OrganizationRole) { return value.abilities.map((ability) => ability.module) }

export function roleActions(value: OrganizationRole) { return value.abilities.flatMap((ability) => ability.actions) }
