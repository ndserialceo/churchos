"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

interface Member {
  id: string
  firstName: string
  lastName: string
}

interface VolunteerRole {
  id: string
  name: string
  description: string | null
  assignments: { member: { id: string; firstName: string; lastName: string } }[]
}

interface VolunteerAssignment {
  id: string
  member: { id: string; firstName: string; lastName: string }
  role: { id: string; name: string }
  startDate: string
  isActive: boolean
}

export default function VolunteersPage() {
  const [roles, setRoles] = useState<VolunteerRole[]>([])
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: "", description: "" })
  const [assignForm, setAssignForm] = useState({ memberId: "", roleId: "", startDate: "" })

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const r = await fetch("/api/volunteers")
        const d = await r.json()
        if (!cancelled && d.success) {
          setRoles(d.data.roles)
          setAssignments(d.data.assignments)
          setMembers(d.data.members)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/volunteers?action=role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleForm),
    })
    const data = await res.json()
    if (data.success) {
      setShowRoleModal(false)
      setRoleForm({ name: "", description: "" })
      setLoading(true)
      const r = await fetch("/api/volunteers")
      const d = await r.json()
      if (d.success) {
        setRoles(d.data.roles)
        setAssignments(d.data.assignments)
        setMembers(d.data.members)
      }
      setLoading(false)
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, string> = {
      memberId: assignForm.memberId,
      roleId: assignForm.roleId,
    }
    if (assignForm.startDate) payload.startDate = assignForm.startDate

    const res = await fetch("/api/volunteers?action=assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      setShowAssignModal(false)
      setAssignForm({ memberId: "", roleId: "", startDate: "" })
      setLoading(true)
      const r = await fetch("/api/volunteers")
      const d = await r.json()
      if (d.success) {
        setRoles(d.data.roles)
        setAssignments(d.data.assignments)
        setMembers(d.data.members)
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRoleModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + New Role
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              + Assign Volunteer
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Roles</h2>
              {roles.length === 0 ? (
                <p className="text-gray-500">No roles created yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900">{role.name}</h3>
                      {role.description && (
                        <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {role.assignments.length} volunteer{role.assignments.length !== 1 ? "s" : ""}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Assignments</h2>
              <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Start Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {a.member.firstName} {a.member.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{a.role.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(a.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              a.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {a.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No assignments yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Create Volunteer Role</h3>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. Choir, Ushering, Media"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowRoleModal(false); setRoleForm({ name: "", description: "" }) }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Create Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Assign Volunteer</h3>
              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Member</label>
                  <select
                    value={assignForm.memberId}
                    onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={assignForm.roleId}
                    onChange={(e) => setAssignForm({ ...assignForm, roleId: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={assignForm.startDate}
                    onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAssignModal(false); setAssignForm({ memberId: "", roleId: "", startDate: "" }) }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
