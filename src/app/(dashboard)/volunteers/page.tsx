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
  assignments: { member: { firstName: string; lastName: string } }[]
}

interface VolunteerAssignment {
  id: string
  member: { firstName: string; lastName: string }
  role: { name: string }
  startDate: string
  isActive: boolean
}

export default function VolunteersPage() {
  const [roles, setRoles] = useState<VolunteerRole[]>([])
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<"role" | "assign">("role")
  const [form, setForm] = useState({ name: "", description: "", memberId: "", roleId: "" })

  function loadData() {
    fetch("/api/volunteers").then(r => r.json()).then(d => {
      if (d.success) {
        setRoles(d.data.roles)
        setAssignments(d.data.assignments)
      }
    })
    fetch("/api/members").then(r => r.json()).then(d => { if (d.success) setMembers(d.data) })
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = formType === "role"
      ? { type: "role", name: form.name, description: form.description }
      : { type: "assign", memberId: form.memberId, roleId: form.roleId }

    const res = await fetch("/api/volunteers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ name: "", description: "", memberId: "", roleId: "" })
      loadData()
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
          <button onClick={() => { setShowForm(!showForm); setFormType("role") }} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">{showForm ? "Cancel" : "+ New Role"}</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex gap-2">
              <button type="button" onClick={() => setFormType("role")} className={`rounded-md px-3 py-1 text-sm ${formType === "role" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>New Role</button>
              <button type="button" onClick={() => setFormType("assign")} className={`rounded-md px-3 py-1 text-sm ${formType === "assign" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Assign Member</button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {formType === "role" ? (
                <>
                  <input placeholder="Role Name (e.g. Choir, Ushering)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
                  <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
                </>
              ) : (
                <>
                  <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required>
                    <option value="">Select Member</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                  </select>
                  <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required>
                    <option value="">Select Role</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </>
              )}
            </div>
            <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              {formType === "role" ? "Create Role" : "Assign Member"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Ministries & Roles</h2>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="rounded-md border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  {role.description && <p className="mt-1 text-sm text-gray-500">{role.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.assignments.length > 0 ? role.assignments.map((a, i) => (
                      <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{a.member.firstName} {a.member.lastName}</span>
                    )) : <span className="text-xs text-gray-400">No members assigned</span>}
                  </div>
                </div>
              ))}
              {roles.length === 0 && <p className="text-center text-gray-500">No roles created yet</p>}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Current Assignments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-600">
                  <tr>
                    <th className="px-2 py-2 font-medium">Member</th>
                    <th className="px-2 py-2 font-medium">Role</th>
                    <th className="px-2 py-2 font-medium">Since</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="px-2 py-2 text-gray-900">{a.member.firstName} {a.member.lastName}</td>
                      <td className="px-2 py-2 text-gray-600">{a.role.name}</td>
                      <td className="px-2 py-2 text-gray-600">{new Date(a.startDate).toLocaleDateString()}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{a.isActive ? "Active" : "Inactive"}</span>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && <tr><td colSpan={4} className="px-2 py-4 text-center text-gray-500">No assignments yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}