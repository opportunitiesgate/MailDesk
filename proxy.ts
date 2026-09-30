import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((request) => {
  const pathname = request.nextUrl.pathname
  const isLogin = pathname === "/login"
  const isUserManagement = pathname === "/users" || pathname.startsWith("/users/")

  if (!request.auth && !isLogin) return NextResponse.redirect(new URL("/login", request.nextUrl.origin))
  if (request.auth && isLogin) return NextResponse.redirect(new URL("/", request.nextUrl.origin))
  if (request.auth && isUserManagement && request.auth.user.role !== "superadmin") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"] }
