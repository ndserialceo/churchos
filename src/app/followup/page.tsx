"use client"

import { useEffect, useState, FormEvent } from "react"

interface FollowUp {
  id: string
  type: string
  notes?: string | null
  status: string
  dueDate?: string | null
  completedAt?: string | null
  createdAt: string
  member: { id: string; firstName: string; lastName: string }
  assignedTo: { id: string; firstName: string; lastName: string }
}

interface Member {
  id: string
  firstName: string
  lastName: string
}

interface User {
  id: string
  firstName: string
  lastName: string
}

const statusTabs = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as const
const statusLabels: Record<string, string> = {
  ALL: "All",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
}
const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
}

const followUpTypes = [
  "Pastoral Visit",
  "New Member Welcome",
  "Prayer Follow-up",
  "Counseling",
  "Membership Transfer",
  "Event Invitation",
  "General",
]

export default function FollowUpPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (activeTab !== "ALL") params.set("status", activeTab)
      try {
        const r = await fetch(`/api/followups?${params}`)
        const res = await r.json()
        if (!cancelled && res.success) {
          setFollowUps(res.data.followUps)
          setTotal(res.data.total)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, activeTab])

  useEffect(() => {
    let cancelled = false
    async function loadDropdowns() {
      try {
        const [membersRes, usersRes] = await Promise.all([
          fetch("/api/members?limit=200"),
          fetch("/api/users?limit=200"),
        ])
        const membersData = await membersRes.json()
        const usersData = await usersRes.json()
        if (!cancelled) {
          if (membersData.success) setMembers(membersData.data.members)
          if (usersData.success) setUsers(usersData.data.users || usersData.data)
        }
      } catch { /* ignore */ }
    }
    loadDropdowns()
    return () => { cancelled = true }
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/followups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setPage((p) => p)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this follow-up?")) return
    await fetch(`/api/followups/${id}`, { method: "DELETE" })
    setPage((p) => p)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="mt-1 text-sm text-gray-500">{total} total follow-ups</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Follow-up
        </button>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1) }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {statusLabels[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : followUps.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No follow-ups found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {followUps.map((fu) => (
            <div key={fu.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fu.member.firstName} {fu.member.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{fu.type}</p>
                </div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[fu.status] || "bg-gray-100 text-gray-800"}`}>
                  {statusLabels[fu.status] || fu.status}
                </span>
              </div>

              {fu.notes && (
                <p className="mb-3 text-sm text-gray-600 line-clamp-2">{fu.notes}</p>
              )}

              <div className="mb-3 space-y-1 text-xs text-gray-500">
                <p>Assigned: {fu.assignedTo.firstName} {fu.assignedTo.lastName}</p>
                {fu.dueDate && (
                  <p className={new Date(fu.dueDate) < new Date() && fu.status !== "COMPLETED" ? "text-red-600 font-medium" : ""}>
                    Due: {new Date(fu.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-3">
                {fu.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange(fu.id, "IN_PROGRESS")}
                    className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Start
                  </button>
                )}
                {fu.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleStatusChange(fu.id, "COMPLETED")}
                    className="rounded bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    Complete
                  </button>
                )}
                {fu.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleDelete(fu.id)}
                    className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-gray-500">{total} total follow-ups</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="py-1 text-sm text-gray-600">Page {page}</span>
          <button
            disabled={followUps.length < 20}
            onClick={() => setPage(page + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <FollowUpForm
          members={members}
          users={users}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); setPage((p) => p) }}
        />
      )}
    </div>
  )
}

function FollowUpForm({
  members,
  users,
  onClose,
  onSaved,
}: {
  members: Member[]
  users: User[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    type: "",
    notes: "",
    memberId: "",
    assignedToId: "",
    dueDate: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          notes: form.notes || undefined,
          dueDate: form.dueDate || null,
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      onSaved()
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="followup-form-title">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 id="followup-form-title" className="text-lg font-semibold">New Follow-up</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close dialog">&times;</button>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select type</option>
              {followUpTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Member *</label>
              <select
                required
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.lastName}, {m.firstName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Assign To *</label>
              <select
                required
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select assignee</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.lastName}, {u.firstName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
