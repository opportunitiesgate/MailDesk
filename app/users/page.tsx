"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Check, Loader2, MoreHorizontal, Plus, Search, Shield, Trash2, Users, X } from "lucide-react"

type User = { _id: string; name?: string; email: string; deliveryEmail?: string; role: "superadmin" | "admin" | "client"; organizationId?: string; active: boolean; createdAt?: string }
type Organization = { id: string; name: string; slug: string; active: boolean }

const roleLabel = { superadmin: "Super admin", admin: "Admin", client: "Client" }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", deliveryEmail: "", role: "client" })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState("")

  async function loadUsers() {
    setLoading(true)
    const response = await fetch("/api/users")
    const data = await response.json()
    if (!response.ok) setError(data.error || "Unable to load users")
    else setUsers(data)
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function createUser(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("")
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const data = await response.json()
    if (!response.ok) setError(data.error || "Unable to create user")
    else { setNotice("Invitation sent successfully"); setModalOpen(false); setForm({ name: "", email: "", deliveryEmail: "", role: "client" }); await loadUsers() }
    setSaving(false)
  }

  async function removeUser(user: User) {
    if (!window.confirm(`Delete ${user.name || user.email}?`)) return
    const response = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
    if (response.ok) setUsers((current) => current.filter((item) => item._id !== user._id))
    else setError((await response.json()).error || "Unable to delete user")
  }

  const filteredUsers = users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()))

  return <main className="min-h-screen bg-[#f8fafc] text-[#172033]"><header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6"><div className="flex items-center gap-3"><Link href="/" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Back to inbox"><ArrowLeft className="h-4 w-4" /></Link><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f46e5] text-sm font-bold text-white">m</div><span className="text-[17px] font-semibold tracking-tight">mail-desk</span></div><div className="flex items-center gap-2 border-l border-slate-200 pl-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-blue-700">AB</div><span className="hidden text-sm font-medium sm:block">Alex Brown</span></div></header><section className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs text-slate-400"><Users className="h-3.5 w-3.5" />Workspace / Users</div><h1 className="text-3xl font-semibold tracking-tight">User management</h1><p className="mt-2 text-sm text-slate-500">Create and manage access for your Mail Desk team.</p></div><button onClick={() => { setError(""); setModalOpen(true) }} className="flex items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"><Plus className="h-4 w-4" />Add user</button></div>{notice && <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check className="h-4 w-4" />{notice}<button className="ml-auto" onClick={() => setNotice("")}><X className="h-4 w-4" /></button></div>}{error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold">Team members</h2><p className="mt-1 text-xs text-slate-400">{users.length} people with workspace access</p></div><div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="w-40 bg-transparent text-xs outline-none placeholder:text-slate-400" /></div></div>{loading ? <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading users…</div> : filteredUsers.length === 0 ? <div className="px-5 py-16 text-center text-sm text-slate-400">No users found.</div> : <div className="divide-y divide-slate-100">{filteredUsers.map((user) => <div key={user._id} className="flex items-center gap-4 px-5 py-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{(user.name || user.email).slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name || "Unnamed user"}</p><p className="truncate text-xs text-slate-400">{user.email}</p></div><span className="hidden items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:flex"><Shield className="h-3 w-3" />{roleLabel[user.role]}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{user.active ? "Active" : "Invited"}</span><button onClick={() => removeUser(user)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${user.email}`}><Trash2 className="h-4 w-4" /></button><MoreHorizontal className="hidden h-4 w-4 text-slate-300 sm:block" /></div>)}</div>}</div></section>{modalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4"><form onSubmit={createUser} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><h2 className="text-lg font-semibold">Add a team member</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">We&apos;ll generate a temporary password and email an activation link.</p></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X className="h-5 w-5 text-slate-400" /></button></div><div className="space-y-4"><label className="block text-xs font-semibold text-slate-600">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label><label className="block text-xs font-semibold text-slate-600">Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label><label className="block text-xs font-semibold text-slate-600">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="client">Client</option><option value="admin">Admin</option></select></label></div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create and invite</button></div></form></div>}</main>
}
