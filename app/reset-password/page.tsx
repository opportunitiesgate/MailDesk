"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { ArrowRight, LockKeyhole } from "lucide-react"

export default function ResetPasswordPage() {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => setToken(new URLSearchParams(window.location.search).get("token") || ""), [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("")
    if (password !== confirmation) { setError("Passwords do not match."); return }
    setLoading(true)
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) })
    const data = await response.json()
    if (!response.ok) setError(data.error || "Unable to update your password.")
    else setMessage(data.message)
    setLoading(false)
  }

  return <main className="min-h-screen bg-[#f7f8fc] text-slate-900"><div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8"><header><Link href="/login" className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">m</span><span className="font-semibold tracking-tight">mail-desk</span></Link></header><div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[.7fr_1.3fr] lg:py-16"><section className="hidden lg:block"><p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Secure account access</p><h1 className="max-w-md text-5xl font-semibold leading-[1.05] tracking-[-.04em]">Choose a new password.</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-500">Your new password will protect access to your MailDesk workspace.</p></section><section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10"><h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>{message ? <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}<Link href="/login" className="mt-3 block font-semibold text-emerald-900">Continue to sign in</Link></div> : <form onSubmit={submit} className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-medium">New password<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"><LockKeyhole className="size-4 text-slate-400" /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} autoComplete="new-password" className="min-w-0 flex-1 outline-none" /></span></label><label className="grid gap-2 text-sm font-medium">Confirm password<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"><LockKeyhole className="size-4 text-slate-400" /><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type="password" required minLength={8} autoComplete="new-password" className="min-w-0 flex-1 outline-none" /></span></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={loading || !token} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? "Updating…" : "Update password"}<ArrowRight className="size-4" /></button></form>}</section></div></div></main>
}
