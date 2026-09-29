import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { findUserByEmail } from "./lib/mongodb"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(credentials)
        if (!parsed.success) return null
        const user = await findUserByEmail(parsed.data.email)
        if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null
        return { id: String(user._id), name: user.name ?? user.email, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.role = token.role as "superadmin" | "admin" | "client"
      return session
    },
  },
})
