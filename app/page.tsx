"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Archive,
  BarChart3,
  Bell,
  ChevronDown,
  CircleHelp,
  FileText,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Megaphone,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react"

const folders = [
  { label: "All inboxes", count: 24, icon: Inbox },
  { label: "Contact", count: 8, icon: Users },
  { label: "Support", count: 11, icon: LifeBuoy },
  { label: "Marketing", count: 5, icon: Megaphone },
]

const messages = [
  { initials: "JD", name: "Jordan Davis", email: "jordan@northstar.co", subject: "Question about the team plan", preview: "Hey there, I’m comparing plans for our growing team and had a quick question…", time: "9:42 AM", tag: "Support", color: "bg-amber-100 text-amber-700" },
  { initials: "AM", name: "Amelia Miller", email: "amelia@fieldnotes.io", subject: "Re: Partnership opportunity", preview: "Thanks for getting back to me. I’d love to find a time to chat about the next steps…", time: "9:18 AM", tag: "Contact", color: "bg-blue-100 text-blue-700" },
  { initials: "SP", name: "Sam Patel", email: "sam@linearway.com", subject: "Your latest campaign report", preview: "The numbers look great! Can you send over the breakdown for last month?", time: "Yesterday", tag: "Marketing", color: "bg-violet-100 text-violet-700" },
  { initials: "RK", name: "Riley Kim", email: "riley@copperstudio.design", subject: "Cannot access my account", preview: "I’ve tried resetting my password twice but haven’t received the email yet.", time: "Yesterday", tag: "Support", color: "bg-amber-100 text-amber-700" },
  { initials: "LW", name: "Lena Wong", email: "lena@goodhabits.app", subject: "Loved the new update", preview: "Just wanted to say the new workflow is fantastic. It’s made our mornings so much easier.", time: "Mon", tag: "Contact", color: "bg-blue-100 text-blue-700" },
]

export default function Home() {
  const [activeFolder, setActiveFolder] = useState("All inboxes")
  const [selected, setSelected] = useState(messages[0])
  const [chatOpen, setChatOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [reply, setReply] = useState("")

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172033]">
      <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f46e5] text-sm font-bold text-white">m</div><span className="text-[17px] font-semibold tracking-tight">mail-desk</span></div>
          <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 md:flex"><button className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">Workspace</button><Link href="/users" className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Users</Link></div>
        </div>
        <div className="flex items-center gap-4"><button onClick={() => setSearchOpen(!searchOpen)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Search"><Search className="h-[18px] w-[18px]" /></button><button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" /></button><div className="flex items-center gap-2 border-l border-slate-200 pl-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-blue-700">AB</div><span className="hidden text-sm font-medium sm:block">Alex Brown</span><ChevronDown className="h-4 w-4 text-slate-400" /></div></div>
      </header>
      {searchOpen && <div className="absolute right-6 top-[62px] z-20 flex w-72 items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"><Search className="ml-2 h-4 w-4 text-slate-400" /><input autoFocus placeholder="Search conversations" className="w-full bg-transparent px-1 py-1.5 text-sm outline-none" /><button onClick={() => setSearchOpen(false)}><X className="h-4 w-4 text-slate-400" /></button></div>}
      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="hidden w-[236px] shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:block">
          <button className="mb-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Compose</button>
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Inbox</p>
          <nav className="space-y-1">{folders.map(({ label, count, icon: Icon }) => <button key={label} onClick={() => setActiveFolder(label)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-sm ${activeFolder === label ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}><span className="flex items-center gap-3"><Icon className="h-[17px] w-[17px]" />{label}</span><span className={`text-xs ${activeFolder === label ? "text-indigo-600" : "text-slate-400"}`}>{count}</span></button>)}</nav>
          <p className="mb-2 mt-9 px-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Manage</p>
          <nav className="space-y-1"><button className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><Send className="h-[17px] w-[17px]" />Sent</button><button className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><Archive className="h-[17px] w-[17px]" />Archive</button><button className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><FileText className="h-[17px] w-[17px]" />Templates</button></nav>
          <div className="mt-auto border-t border-slate-100 pt-6"><div className="rounded-xl bg-slate-50 p-3.5"><div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-semibold text-slate-700">Resend connected</span></div><p className="text-[11px] leading-relaxed text-slate-500">Webhooks are active and receiving events.</p></div></div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5"><div><div className="mb-1 flex items-center gap-2 text-xs text-slate-400"><LayoutDashboard className="h-3.5 w-3.5" />Workspace <span>/</span> Inbox</div><h1 className="text-2xl font-semibold tracking-tight">Good morning, Alex</h1></div><button className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:flex"><BarChart3 className="h-4 w-4" />View analytics</button></div>
          <div className="flex flex-1 min-h-0 flex-col xl:flex-row">
            <div className="w-full border-r border-slate-200 bg-white xl:w-[410px]"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold">{activeFolder}</h2><p className="mt-0.5 text-xs text-slate-400">24 conversations</p></div><button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></button></div><div className="border-b border-slate-100 px-5 py-3"><div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400"><Search className="h-3.5 w-3.5" />Search inbox</div></div><div>{messages.map((message, i) => <button key={message.email} onClick={() => setSelected(message)} className={`flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left transition-colors ${selected.email === message.email ? "bg-indigo-50/70" : "hover:bg-slate-50"}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{message.initials}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold">{message.name}</span><span className="shrink-0 text-[10px] text-slate-400">{message.time}</span></div><p className="mt-1 truncate text-xs font-medium text-slate-700">{message.subject}</p><p className="mt-1 truncate text-[11px] text-slate-400">{message.preview}</p><span className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold ${message.color}`}>{message.tag}</span></div></button>)}</div></div>
            <article className="hidden min-w-0 flex-1 bg-[#fbfcfe] xl:flex xl:flex-col"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5"><div><div className="mb-1 flex items-center gap-2"><h2 className="text-base font-semibold">{selected.subject}</h2><span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${selected.color}`}>{selected.tag}</span></div><p className="text-xs text-slate-400">{selected.email}</p></div><div className="flex items-center gap-1"><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Archive className="h-4 w-4" /></button><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></button></div></div><div className="flex-1 overflow-auto px-7 py-7"><div className="mb-8 flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">{selected.initials}</div><div><div className="flex items-baseline gap-2"><span className="text-sm font-semibold">{selected.name}</span><span className="text-[11px] text-slate-400">Today, 9:42 AM</span></div><p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Hi Alex,<br /><br />{selected.preview} I’d appreciate any guidance you can share. We’re hoping to make a decision this week, so a little more detail would be really helpful.<br /><br />Thanks,<br />{selected.name.split(" ")[0]}</p></div></div><div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300"><div className="h-px flex-1 bg-slate-200" />Today<div className="h-px flex-1 bg-slate-200" /></div></div><div className="border-t border-slate-200 bg-white px-7 py-5"><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="min-h-20 w-full resize-none text-sm text-slate-700 outline-none placeholder:text-slate-400" /><div className="flex items-center justify-between"><span className="text-[11px] text-slate-400">Replying as <strong className="font-semibold text-slate-600">hello@mail-desk.com</strong></span><button onClick={() => setReply("")} className="flex items-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><Send className="h-3.5 w-3.5" />Send reply</button></div></div></article>
          </div>
        </section>
      </div>
      {chatOpen && <div className="fixed bottom-5 right-5 z-30 w-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30"><div className="flex items-center justify-between bg-[#172033] px-4 py-3.5 text-white"><div className="flex items-center gap-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500"><Sparkles className="h-3.5 w-3.5" /></div><div><p className="text-xs font-semibold">Admin chat</p><p className="text-[10px] text-slate-300">3 teammates online</p></div></div><button onClick={() => setChatOpen(false)} className="text-slate-300 hover:text-white" aria-label="Close chat"><X className="h-4 w-4" /></button></div><div className="space-y-3 p-3.5"><div className="flex gap-2"><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-[9px] font-bold text-pink-700">JM</div><div className="rounded-r-lg rounded-bl-lg bg-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-600"><strong className="block text-[10px] text-slate-800">Jamie Miller</strong>The campaign report is ready to review.</div></div><div className="flex justify-end"><div className="rounded-l-lg rounded-br-lg bg-indigo-600 px-3 py-2 text-[11px] text-white">I’ll take a look now.</div></div><div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2"><input placeholder="Message your team…" className="min-w-0 flex-1 text-[11px] outline-none" /><button className="text-indigo-600"><Send className="h-3.5 w-3.5" /></button></div></div></div>}
      {!chatOpen && <button onClick={() => setChatOpen(true)} className="fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#172033] text-white shadow-lg" aria-label="Open admin chat"><Sparkles className="h-5 w-5" /></button>}
    </main>
  )
}
