"use client"

import { Can } from "@casl/react"
import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft, Mail, RefreshCw, Webhook } from "lucide-react"

type MailingEvent = { id: string; type: string; eventId: string; createdAt: string }
const fetcher = (url: string) => fetch(url).then((response) => response.json())

export default function MailingClient() {
  const { data, isLoading, mutate } = useSWR<MailingEvent[]>("/api/mailing/events", fetcher)
  const events = Array.isArray(data) ? data : []

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172033]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><Link href="/" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Back to workspace"><ArrowLeft className="h-4 w-4" /></Link><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">m</div><div className="min-w-0"><p className="truncate text-sm font-semibold">Mailing center</p><p className="truncate text-xs text-slate-400">Delivery and webhook activity</p></div></div>
          <Can I="read" a="Email"><button onClick={() => mutate()} className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" aria-label="Refresh mailing events"><RefreshCw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Refresh</span></button></Can>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><Mail className="mb-4 h-5 w-5 text-indigo-600" /><p className="text-2xl font-semibold">{events.length}</p><p className="mt-1 text-xs text-slate-500">Recent events</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><Webhook className="mb-4 h-5 w-5 text-emerald-600" /><p className="text-2xl font-semibold">Active</p><p className="mt-1 text-xs text-slate-500">Webhook listener</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Scope</p><p className="text-sm font-semibold">Organization mailing</p><p className="mt-1 text-xs text-slate-500">Events are isolated by organization.</p></div></div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h1 className="text-sm font-semibold">Webhook events</h1><p className="mt-1 text-xs text-slate-500">Delivery status received from Resend.</p></div>{isLoading ? <p className="px-5 py-10 text-center text-sm text-slate-400">Loading events…</p> : events.length === 0 ? <div className="px-5 py-12 text-center"><Webhook className="mx-auto mb-3 h-7 w-7 text-slate-300" /><p className="text-sm font-medium text-slate-600">No webhook events yet</p><p className="mt-1 text-xs text-slate-400">Events will appear here when mailing activity arrives.</p></div> : <div className="divide-y divide-slate-100">{events.map((event) => <div key={event.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-sm font-medium text-slate-700">{event.type}</span></div><span className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</span></div>)}</div>}</div>
      </section>
    </main>
  )
}
