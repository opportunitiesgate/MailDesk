"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowLeft, Building2, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react"

type Organization = { id: string; name: string; slug: string; active: boolean }
type Role = { _id: string; name: string; abilities: Array<{ module: string; actions: string[] }> }
const modules = ["User", "Email", "Chat"] as const
const actions = ["read", "create", "update", "delete"] as const

export default function OrganizationsClient({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [roles, setRoles] = useState<Role[]>([])
  const [roleName, setRoleName] = useState("")
  const [selectedAbilities, setSelectedAbilities] = useState<Record<string, string[]>>({})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true)
    const response = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug }) })
    const result = await response.json(); setSaving(false)
    if (!response.ok) { setError(result.error ?? "Unable to create organization"); return }
    setOrganizations((current) => [...current, { id: result.id, name: result.name, slug: result.slug, active: true }].sort((a, b) => a.name.localeCompare(b.name)))
    setName(""); setSlug("")
  }

  async function selectOrganization(id: string) {
    setSelectedId(id); setError("")
    const response = await fetch(`/api/organizations/${id}/roles`)
    const result = await response.json()
    if (!response.ok) { setError(result.error ?? "Unable to load roles"); return }
    setRoles(result)
  }

  function toggleAbility(module: string, action: string) {
    const key = module
    setSelectedAbilities((current) => ({ ...current, [key]: current[key]?.includes(action) ? current[key].filter((item) => item !== action) : [...(current[key] ?? []), action] }))
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedId || !roleName.trim()) return
    setSaving(true); setError("")
    const abilities = Object.entries(selectedAbilities).filter(([, actions]) => actions.length).map(([module, actions]) => ({ module, actions }))
    const response = await fetch(`/api/organizations/${selectedId}/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: roleName, abilities }) })
    const result = await response.json(); setSaving(false)
    if (!response.ok) { setError(result.error ?? "Unable to create role"); return }
    setRoles((current) => [...current, result].sort((a, b) => a.name.localeCompare(b.name))); setRoleName(""); setSelectedAbilities({})
  }

  async function deactivate(id: string) {
    if (!window.confirm("Deactivate this organization?")) return
    const response = await fetch(`/api/organizations?id=${id}`, { method: "DELETE" })
    if (response.ok) setOrganizations((current) => current.map((organization) => organization.id === id ? { ...organization, active: false } : organization))
  }

  async function deleteRole(roleId: string) {
    if (!selectedId || !window.confirm("Delete this role?")) return
    const response = await fetch(`/api/organizations/${selectedId}/roles?roleId=${roleId}`, { method: "DELETE" })
    if (response.ok) setRoles((current) => current.filter((role) => role._id !== roleId))
  }

  return <main className="min-h-screen bg-[#f8fafc] text-[#172033]"><header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6"><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to workspace</Link><div className="flex items-center gap-2 text-sm font-semibold"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f46e5] text-white">m</div>mail-desk</div></header><div className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8 flex items-start justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Organizations</h1><p className="mt-2 text-sm text-slate-500">Manage workspaces, organization roles, and module permissions.</p></div><div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"><ShieldCheck className="h-4 w-4" />Super admin</div></div>{error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<div className="grid gap-6 lg:grid-cols-[320px_1fr]"><section className="space-y-6"><form onSubmit={createOrganization} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-semibold">New organization</h2><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Organization name" className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /><input required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug-name" className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /><button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create organization</button></form><div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><h2 className="px-3 pb-3 text-sm font-semibold">Organizations</h2>{organizations.map((organization) => <button key={organization.id} onClick={() => selectOrganization(organization.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${selectedId === organization.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"}`}><span className="flex items-center gap-2"><Building2 className="h-4 w-4" />{organization.name}</span>{organization.active ? <span className="text-[11px] text-emerald-600">Active</span> : <span className="text-[11px] text-slate-400">Inactive</span>}</button>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{selectedId ? <><div className="mb-6"><h2 className="font-semibold">Organization roles</h2><p className="mt-1 text-sm text-slate-500">Assign access to User, Email, and Chat modules.</p></div><form onSubmit={createRole} className="mb-6 rounded-xl bg-slate-50 p-4"><input required value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Role name, e.g. Support agent" className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" /><div className="grid gap-3 md:grid-cols-3">{modules.map((module) => <fieldset key={module} className="rounded-lg border border-slate-200 bg-white p-3"><legend className="px-1 text-xs font-semibold">{module}</legend>{actions.map((action) => <label key={action} className="flex items-center gap-2 py-1 text-xs text-slate-600"><input type="checkbox" checked={selectedAbilities[module]?.includes(action) ?? false} onChange={() => toggleAbility(module, action)} />{action}</label>)}</fieldset>)}</div><button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add role</button></form><div className="space-y-3">{roles.map((role) => <div key={role._id} className="flex items-start justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-medium">{role.name}</p><div className="mt-2 flex flex-wrap gap-2">{role.abilities.flatMap((ability) => ability.actions.map((action) => <span key={`${ability.module}-${action}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{ability.module}: {action}</span>))}</div></div><button onClick={() => deleteRole(role._id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${role.name}`}><Trash2 className="h-4 w-4" /></button></div>)}{!roles.length && <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No custom roles yet.</p>}</div></> : <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-slate-400"><Building2 className="mb-3 h-10 w-10" /><p className="text-sm">Select an organization to manage its roles.</p></div>}</section></div></div></main>
}
