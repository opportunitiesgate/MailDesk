import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User { role: string; organizationId?: string }
  interface Session { user: { role: string; organizationId?: string } & DefaultSession["user"] }
}

declare module "next-auth/jwt" {
  interface JWT { role?: string; organizationId?: string }
}
