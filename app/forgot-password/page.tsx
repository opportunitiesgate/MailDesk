"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowRight, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("")
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
    const data = await response.json()
    if (!response.ok) setError(data.error || "Unable to send reset email.")
    else setMessage(data.message)
    setLoading(false)
  }

  return <main className="min-h-screen bg-[#f7f8fc] text-slate-900"><div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8"><header><Link href="/login" className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">m</span><span className="font-semibold tracking-tight">mail-desk</span></Link></header><div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[.7fr_1.3fr] lg:py-16"><section className="hidden lg:block"><p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Account recovery</p><h1 className="max-w-md text-5xl font-semibold leading-[1.05] tracking-[-.04em]">Get back to your inbox.</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-500">We&apos;ll send a secure, one-time link to reset your password.</p></section><section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10"><h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your account email and we&apos;ll send reset instructions.</p>{message ? <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{message}<Link href="/login" className="mt-3 block font-semibold text-emerald-900">Return to sign in</Link></div> : <form onSubmit={submit} className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-medium">Email<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"><Mail className="size-4 text-slate-400" /><input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" required autoComplete="email" className="min-w-0 flex-1 outline-none" /></span></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? "Sending…" : "Send reset link"}<ArrowRight className="size-4" /></button><Link href="/login" className="text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">Back to sign in</Link></form>}</section></div></div></main>
}
