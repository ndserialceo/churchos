"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

interface Member {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  status: string
}

interface FollowUp {
  id: string
  type: string
  notes: string | null
  status: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  member: { firstName: string; lastName: string; phone: string | null }
  assignedTo: { firstName: string; lastName: string }
}

interface Visitation {
  id: string
  visitDate: string
  type: string
  notes: string | null
  outcome: string | null
  member: { firstName: string; lastName: string }
  visitedBy: { firstName: string; lastName: string }
}

export default function FollowUpPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string; role: string }[]>([])
  const [activeTab, setActiveTab] = useState<"followups" | "visitations">("followups")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: "NEW_CONVERT", memberId: "", assignedToId: "", notes: "", dueDate: "",
  })

  function loadData() {
    fetch("/api/followup").then(r => r.json()).then(d => { if (d.success) setFollowUps(d.data) })
    fetch("/api/members").then(r => r.json()).then(d => { if (d.success) setMembers(d.data) })
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ type: "NEW_CONVERT", memberId: "", assignedToId: "", notes: "", dueDate: "" })
      loadData()
    }
  }

  async function completeFollowUp(id: string) {
    await fetch(`/api/followup/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    })
    loadData()
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Follow-up & Visitation</h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("followups")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "followups" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Follow-ups</button>
            <button onClick={() => setActiveTab("visitations")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "visitations" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Visitations</button>
            <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">{showForm ? "Cancel" : "+ New Follow-up"}</button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required>
                <option value="NEW_CONVERT">New Convert</option>
                <option value="VISITOR">Visitor</option>
                <option value="PASTORAL_CARE">Pastoral Care</option>
                <option value="DISCIPLESHIP">Discipleship</option>
              </select>
              <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required>
                <option value="">Select Member</option>
                {members.filter(m => m.status === "ACTIVE").map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="col-span-full rounded-md border border-gray-300 px-3 py-2" rows={2} />
            </div>
            <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Create Follow-up</button>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {followUps.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.member.firstName} {f.member.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{f.type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-600">{f.assignedTo.firstName} {f.assignedTo.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "-"}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">{f.notes || "-"}</td>
                  <td className="px-4 py-3">
                    {f.status !== "COMPLETED" && (
                      <button onClick={() => completeFollowUp(f.id)} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200">Complete</button>
                    )}
                  </td>
                </tr>
              ))}
              {followUps.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No follow-ups found</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}