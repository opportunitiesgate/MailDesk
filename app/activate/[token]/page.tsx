"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"

export default function ActivatePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  async function submit(event: React.FormEvent) { event.preventDefault(); if (password !== confirm) return setError("Passwords do not match"); setSaving(true); const response = await fetch("/api/users/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to activate account"); setSaving(false); return } router.push("/login?activated=1") }
  return <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-7 flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f46e5] text-sm font-bold text-white">m</div><span className="text-lg font-semibold">mail-desk</span></div><h1 className="text-2xl font-semibold tracking-tight">Activate your account</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">Choose a new password to finish setting up your Mail Desk account.</p>{error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<label className="mt-6 block text-xs font-semibold text-slate-600">New password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500" /></label><label className="mt-4 block text-xs font-semibold text-slate-600">Confirm password<input required minLength={8} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500" /></label><button disabled={saving} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Activate account</button></form></main>
}
