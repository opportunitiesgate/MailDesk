import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User { role: "superadmin" | "admin" }
  interface Session { user: { role: "superadmin" | "admin" } & DefaultSession["user"] }
}

declare module "next-auth/jwt" {
  interface JWT { role?: "superadmin" | "admin" }
}
