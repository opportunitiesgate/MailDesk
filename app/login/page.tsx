"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import { Mail, LockKeyhole, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const result = await signIn("credentials", { email: String(form.get("email") ?? "").trim().toLowerCase(), password: String(form.get("password") ?? ""), redirect: false, callbackUrl: "/" })
    if (result?.error) {
      setError("Invalid email or password.")
      setLoading(false)
      return
    }
    window.location.assign("/")
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 text-[#172033]"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-8 flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f46e5] text-lg font-bold text-white">m</div><span className="text-lg font-semibold tracking-tight">mail-desk</span></div><h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-slate-500">Sign in to manage your team&apos;s inbox.</p><form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block text-sm font-medium">Email<div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5"><Mail className="h-4 w-4 text-slate-400" /><input name="email" type="email" required autoComplete="email" className="w-full outline-none" /></div></label><label className="block text-sm font-medium">Password<div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5"><LockKeyhole className="h-4 w-4 text-slate-400" /><input name="password" type="password" required minLength={8} autoComplete="current-password" className="w-full outline-none" /></div></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}<ArrowRight className="h-4 w-4" /></button></form></section></main>
}
