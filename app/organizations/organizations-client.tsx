"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowLeft, Building2, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react"

type Organization = { id: string; name: string; slug: string; active: boolean }

export default function OrganizationsClient({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSaving(true)
    const response = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug }) })
    const result = await response.json()
    setSaving(false)
    if (!response.ok) { setError(result.error ?? "Unable to create organization"); return }
    setOrganizations((current) => [...current, { id: result.id, name: result.name, slug: result.slug, active: true }].sort((a, b) => a.name.localeCompare(b.name)))
    setName(""); setSlug("")
  }

  async function deactivate(id: string) {
    if (!window.confirm("Deactivate this organization?")) return
    const response = await fetch(`/api/organizations?id=${id}`, { method: "DELETE" })
    if (response.ok) setOrganizations((current) => current.map((organization) => organization.id === id ? { ...organization, active: false } : organization))
  }

  return <main className="min-h-screen bg-[#f8fafc] text-[#172033]"><header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6"><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to workspace</Link><div className="flex items-center gap-2 text-sm font-semibold"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f46e5] text-white">m</div>mail-desk</div></header><div className="mx-auto max-w-5xl px-6 py-10"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Organizations</h1><p className="mt-2 text-sm text-slate-500">Create and manage the organizations in your Mail-Desk workspace.</p></div><div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"><ShieldCheck className="h-4 w-4" />Super admin</div></div><div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]"><form onSubmit={createOrganization} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Plus className="h-5 w-5" /></div><div><h2 className="font-semibold">New organization</h2><p className="text-xs text-slate-400">Add a workspace for a team.</p></div></div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Organization name</label><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Opportunity Gates" className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><label className="mb-1.5 block text-xs font-semibold text-slate-600">Slug</label><input required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder="opportunity-gates" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><p className="mb-5 text-[11px] text-slate-400">Lowercase letters, numbers, and hyphens only.</p>{error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}<button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create organization</button></form><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Your organizations</h2><p className="mt-1 text-xs text-slate-400">{organizations.length} total</p></div><Building2 className="h-5 w-5 text-slate-300" /></div>{organizations.length === 0 ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No organizations yet.</p> : <div className="space-y-3">{organizations.map((organization) => <div key={organization.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">{organization.name.slice(0, 1).toUpperCase()}</div><div><p className="text-sm font-semibold">{organization.name}</p><p className="text-xs text-slate-400">/{organization.slug}</p></div></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${organization.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{organization.active ? "Active" : "Inactive"}</span>{organization.active && <button onClick={() => deactivate(organization.id)} aria-label={`Deactivate ${organization.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>}</div></div>)}</div>}</section></div></div></main>
}
