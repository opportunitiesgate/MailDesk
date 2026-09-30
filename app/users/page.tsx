"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Plus, Search, Trash2, Users, X } from "lucide-react"

type User = { _id: string; name?: string; email: string; deliveryEmail?: string; role: string; organizationId?: string; active: boolean }
type Organization = { id: string; name: string; slug: string; active: boolean }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [form, setForm] = useState({ name: "", email: "", deliveryEmail: "", role: "client", organizationId: "" })
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    const [usersResponse, organizationsResponse] = await Promise.all([fetch("/api/users"), fetch("/api/organizations")])
    const usersData = await usersResponse.json()
    const organizationsData = await organizationsResponse.json()
    if (usersResponse.ok) setUsers(usersData)
    else setError(usersData.error ?? "Unable to load users")
    if (organizationsResponse.ok) setOrganizations(organizationsData)
  }

  useEffect(() => { load() }, [])

  async function createUser(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("")
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? "Unable to create user")
    else { setModalOpen(false); setForm({ name: "", email: "", deliveryEmail: "", role: "client", organizationId: "" }); await load() }
    setSaving(false)
  }

  async function removeUser(user: User) {
    if (!window.confirm(`Delete ${user.name || user.email}?`)) return
    const response = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
    if (response.ok) setUsers((current) => current.filter((item) => item._id !== user._id))
    else setError((await response.json()).error ?? "Unable to delete user")
  }

  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())), [users, query])
  const organizationName = (id?: string) => organizations.find((organization) => organization.id === id)?.name ?? "Global"

  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="flex h-[72px] items-center justify-between border-b bg-white px-6"><Link href="/" className="flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />Back to workspace</Link><strong className="text-lg">mail-desk</strong></header><section className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">Administration</p><h1 className="text-3xl font-semibold">User management</h1><p className="mt-2 text-sm text-slate-500">Manage organization members, roles, and invitation delivery.</p></div><button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Add user</button></div>{error && <div className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}<div className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="w-full text-sm outline-none" /></div><div className="overflow-hidden rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user._id} className="border-b last:border-0"><td className="px-5 py-4"><div className="font-medium">{user.name || "Unnamed user"}</div><div className="text-xs text-slate-500">{user.email}{user.deliveryEmail && user.deliveryEmail !== user.email ? ` · delivers to ${user.deliveryEmail}` : ""}</div></td><td className="px-5 py-4 text-slate-600">{organizationName(user.organizationId)}</td><td className="px-5 py-4 capitalize">{user.role}</td><td className="px-5 py-4"><span className={user.active ? "text-emerald-600" : "text-amber-600"}>{user.active ? "Active" : "Pending"}</span></td><td className="px-5 py-4 text-right"><button onClick={() => removeUser(user)} aria-label={`Delete ${user.email}`} className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></section>{modalOpen && <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/30 p-4"><form onSubmit={createUser} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Create user</h2><button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div><div className="space-y-3"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="w-full rounded-lg border px-3 py-2.5 text-sm" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Mail-Desk login email" className="w-full rounded-lg border px-3 py-2.5 text-sm" /><input type="email" value={form.deliveryEmail} onChange={(event) => setForm({ ...form, deliveryEmail: event.target.value })} placeholder="Invitation delivery email" className="w-full rounded-lg border px-3 py-2.5 text-sm" /><select value={form.organizationId} onChange={(event) => setForm({ ...form, organizationId: event.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm"><option value="">Global / no organization</option>{organizations.filter((organization) => organization.active).map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select><input required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Organization role" className="w-full rounded-lg border px-3 py-2.5 text-sm" /></div><button disabled={saving} className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Creating..." : "Create and send invitation"}</button></form></div>}</main>
}
