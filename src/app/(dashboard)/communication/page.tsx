"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

interface Member {
  id: string
  firstName: string
  lastName: string
  phone: string | null
}

interface Communication {
  id: string
  type: string
  recipient: string
  message: string
  status: string
  sentAt: string | null
  member: { firstName: string; lastName: string } | null
}

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  createdAt: string
}

export default function CommunicationPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeTab, setActiveTab] = useState<"send" | "history" | "announcements">("send")
  const [form, setForm] = useState({
    type: "SMS", memberId: "", recipient: "", subject: "", message: "",
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  function loadData() {
    fetch("/api/members").then(r => r.json()).then(d => { if (d.success) setMembers(d.data) })
    fetch("/api/communication").then(r => r.json()).then(d => { if (d.success) setCommunications(d.data) })
    fetch("/api/communication/announcements").then(r => r.json()).then(d => { if (d.success) setAnnouncements(d.data) })
  }

  useEffect(() => { loadData() }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setResult(null)

    const selectedMember = members.find((m) => m.id === form.memberId)
    const recipient = form.recipient || selectedMember?.phone || ""

    const res = await fetch("/api/communication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        memberId: form.memberId || null,
        recipient,
        subject: form.subject,
        message: form.message,
      }),
    })

    const data = await res.json()
    setResult(data.success ? "Message sent successfully!" : `Failed: ${data.error}`)
    setSending(false)
    loadData()
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Communication</h1>

        <div className="mb-6 flex gap-2">
          <button onClick={() => setActiveTab("send")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "send" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Send Message</button>
          <button onClick={() => setActiveTab("history")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>History</button>
          <button onClick={() => setActiveTab("announcements")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "announcements" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Announcements</button>
        </div>

        {activeTab === "send" && (
          <form onSubmit={handleSend} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Channel</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="SMS">SMS (Africa's Talking)</option>
                  <option value="WHATSAPP">WhatsApp (Africa's Talking)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Send to Member (optional)</label>
                <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Manual recipient entry</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} {m.phone ? `(${m.phone})` : ""}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient Phone</label>
                <input placeholder="+2348012345678" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject (optional)</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
              </div>

              {result && (
                <div className={`rounded-md p-3 text-sm ${result.startsWith("Message sent") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{result}</div>
              )}

              <button type="submit" disabled={sending} className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? "Sending..." : `Send via ${form.type}`}
              </button>
            </div>
          </form>
        )}

        {activeTab === "history" && (
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {communications.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.type === "SMS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{c.type}</span></td>
                    <td className="px-4 py-3 text-gray-900">{c.recipient}</td>
                    <td className="px-4 py-3 text-gray-600">{c.member ? `${c.member.firstName} ${c.member.lastName}` : "-"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-600">{c.message}</td>
                    <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "SENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-gray-600">{c.sentAt ? new Date(c.sentAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
                {communications.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No communications sent yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "announcements" && <AnnouncementsView announcements={announcements} onUpdate={loadData} />}
      </main>
    </div>
  )
}

function AnnouncementsView({ announcements, onUpdate }: { announcements: Announcement[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/communication/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ title: "", content: "", priority: "NORMAL" })
      onUpdate()
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">{showForm ? "Cancel" : "+ New Announcement"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="block w-full rounded-md border border-gray-300 px-3 py-2" required />
            <textarea placeholder="Content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="block w-full rounded-md border border-gray-300 px-3 py-2" required />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="block w-full rounded-md border border-gray-300 px-3 py-2">
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Post Announcement</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{a.title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                a.priority === "URGENT" ? "bg-red-100 text-red-700" : a.priority === "HIGH" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
              }`}>{a.priority}</span>
            </div>
            <p className="text-sm text-gray-600">{a.content}</p>
            <p className="mt-2 text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-center text-gray-500">No announcements yet</p>}
      </div>
    </div>
  )
}