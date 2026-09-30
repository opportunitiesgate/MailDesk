"use client"

import Link from "next/link"
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
    const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false })
    if (result?.error) {
      setError("Invalid email or password.")
      setLoading(false)
      return
    }
    window.location.assign("/")
  }

  return <main className="min-h-screen bg-[#f7f8fc] text-slate-900"><div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8"><header className="flex items-center justify-between"><Link href="/register" className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">m</span><span className="font-semibold tracking-tight">mail-desk</span></Link><Link href="/register" className="text-sm text-slate-500 hover:text-slate-900">Need an account? <span className="font-semibold text-indigo-600">Create one</span></Link></header><div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[.7fr_1.3fr] lg:py-16"><section className="hidden lg:block"><p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Welcome back</p><h1 className="max-w-md text-5xl font-semibold leading-[1.05] tracking-[-.04em]">Your team&apos;s inbox, ready when you are.</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-500">Sign in to pick up where your team left off.</p></section><section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10"><h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-slate-500">Sign in to manage your team&apos;s inbox.</p><form onSubmit={handleSubmit} className="mt-7 grid gap-5"><label className="grid gap-2 text-sm font-medium">Email<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5"><Mail className="size-4 text-slate-400" /><input name="email" type="email" required autoComplete="email" className="w-full outline-none" /></span></label><label className="grid gap-2 text-sm font-medium">Password<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5"><LockKeyhole className="size-4 text-slate-400" /><input name="password" type="password" required minLength={8} autoComplete="current-password" className="w-full outline-none" /></span></label><div className="-mt-2 text-right"><Link href="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Forgot password?</Link></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}<ArrowRight className="size-4" /></button></form></section></div></div></main>
}
