import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability"

export type Role = "superadmin" | "admin" | "client"
export type Action = "manage" | "read" | "create" | "update" | "delete"
export type Subject = "User" | "Email" | "Chat" | "all"

export type AppAbility = MongoAbility<[Action, Subject]>

export function defineAbilityFor(role: Role | undefined): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (role === "superadmin") {
    can("manage", "all")
  } else if (role === "admin") {
    can("read", "User")
    can("read", "Email")
    can("manage", "Chat")
  } else if (role === "client") {
    can("read", "Email")
    can("manage", "Chat")
  }

  cannot("delete", "all")
  if (role === "superadmin") can("delete", "User")

  return build()
}

export function roleFromSession(role: string | undefined): Role | undefined {
  return role === "superadmin" || role === "admin" || role === "client" ? role : undefined
}
