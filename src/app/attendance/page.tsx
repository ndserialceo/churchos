"use client"

import { useEffect, useState } from "react"

interface Member {
  id: string
  firstName: string
  lastName: string
}

interface AttendanceRecord {
  id: string
  date: string
  service: string | null
  member: { id: string; firstName: string; lastName: string }
  recordedBy: { firstName: string; lastName: string }
}

export default function AttendancePage() {
  const [members, setMembers] = useState<Member[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    service: "",
  })

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    service: "",
  })

  useEffect(() => {
    let cancelled = false
    async function loadMembers() {
      const r = await fetch("/api/members?limit=200")
      const d = await r.json()
      if (!cancelled && d.success) setMembers(d.data.members || d.data)
    }
    loadMembers()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadRecords() {
      const params = new URLSearchParams()
      if (filters.startDate) params.set("startDate", filters.startDate)
      if (filters.endDate) params.set("endDate", filters.endDate)
      if (filters.service) params.set("service", filters.service)
      try {
        const r = await fetch(`/api/attendance?${params}`)
        const d = await r.json()
        if (!cancelled && d.success) setRecords(d.data.records)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRecords()
    return () => { cancelled = true }
  }, [filters])

  function toggleMember(memberId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  function toggleAll() {
    const filtered = getFilteredMembers()
    if (selectedMemberIds.length === filtered.length) {
      setSelectedMemberIds([])
    } else {
      setSelectedMemberIds(filtered.map((m) => m.id))
    }
  }

  function getFilteredMembers() {
    if (!memberSearch) return members
    const q = memberSearch.toLowerCase()
    return members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedMemberIds.length === 0) return

    setSubmitting(true)
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        service: form.service,
        memberIds: selectedMemberIds,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ date: new Date().toISOString().split("T")[0], service: "" })
      setSelectedMemberIds([])
      setMemberSearch("")
    }
    setSubmitting(false)
  }

  const filteredMembers = getFilteredMembers()

  return (
    <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Record Attendance"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-lg border bg-white p-6 shadow-sm"
          >
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Service Name
                </label>
                <input
                  placeholder="e.g. Sunday Service, Wednesday Prayer"
                  value={form.service}
                  onChange={(e) =>
                    setForm({ ...form, service: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select Members ({selectedMemberIds.length} selected)
              </label>
              <input
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
                <label className="flex cursor-pointer items-center gap-2 border-b bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={
                      filteredMembers.length > 0 &&
                      selectedMemberIds.length === filteredMembers.length
                    }
                    onChange={toggleAll}
                    className="rounded"
                  />
                  Select All ({filteredMembers.length})
                </label>
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="rounded"
                    />
                    {member.firstName} {member.lastName}
                  </label>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-gray-500">
                    No members found
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedMemberIds.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : `Save Attendance (${selectedMemberIds.length} members)`}
            </button>
          </form>
        )}

        <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service
              </label>
              <input
                placeholder="Filter by service"
                value={filters.service}
                onChange={(e) =>
                  setFilters({ ...filters, service: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading attendance records...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(record.date).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {record.service || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {record.member.firstName} {record.member.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {record.recordedBy.firstName}{" "}
                      {record.recordedBy.lastName}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  )
}
