"use client"

import { useEffect, useState, FormEvent } from "react"

interface Member {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  email?: string
  status: string
  joinedDate?: string
  gender?: string
  family?: { id: string; name: string } | null
}

function MembersTable({ onEdit, onRefresh }: { onEdit: (m: Member) => void; onRefresh: () => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      try {
        const r = await fetch(`/api/members?${params}`)
        const res = await r.json()
        if (!cancelled && res.success) {
          setMembers(res.data.members)
          setTotal(res.data.total)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, search])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    setPage(1)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this member?")) return
    await fetch(`/api/members/${id}`, { method: "DELETE" })
    onRefresh()
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-yellow-100 text-yellow-800",
    TRANSFERRED: "bg-blue-100 text-blue-800",
    DECEASED: "bg-gray-100 text-gray-800",
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Search
        </button>
      </form>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No members found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-2 font-medium text-gray-500">Name</th>
                <th className="p-2 font-medium text-gray-500">Phone</th>
                <th className="p-2 font-medium text-gray-500">Email</th>
                <th className="p-2 font-medium text-gray-500">Status</th>
                <th className="p-2 font-medium text-gray-500">Family</th>
                <th className="p-2 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-2 font-medium">{m.lastName}, {m.firstName}</td>
                  <td className="p-2 text-gray-600">{m.phone || "—"}</td>
                  <td className="p-2 text-gray-600">{m.email || "—"}</td>
                  <td className="p-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[m.status] || "bg-gray-100 text-gray-800"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{m.family?.name || "—"}</td>
                  <td className="p-2">
                    <button onClick={() => onEdit(m)} className="mr-2 text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{total} total members</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Prev</button>
          <span className="py-1 text-sm text-gray-600">Page {page}</span>
          <button disabled={members.length < 20} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}

function MemberForm({ member, onClose, onSaved }: { member?: Member | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    middleName: member?.middleName || "",
    phone: member?.phone || "",
    email: member?.email || "",
    gender: member?.gender || "",
    status: member?.status || "ACTIVE",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url = member ? `/api/members/${member.id}` : "/api/members"
      const method = member ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="member-form-title">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 id="member-form-title" className="text-lg font-semibold">{member ? "Edit Member" : "Add Member"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close dialog">&times;</button>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">First Name *</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Last Name *</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Middle Name</label>
            <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="DECEASED">Deceased</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const [editing, setEditing] = useState<Member | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSaved() {
    setEditing(null)
    setShowAdd(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <button onClick={() => setShowAdd(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Add Member
        </button>
      </div>

      <div key={refreshKey}>
        <MembersTable onEdit={setEditing} onRefresh={() => setRefreshKey((k) => k + 1)} />
      </div>

      {(showAdd || editing) && (
        <MemberForm member={editing} onClose={() => { setEditing(null); setShowAdd(false) }} onSaved={handleSaved} />
      )}
    </div>
  )
}
