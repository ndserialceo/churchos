"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

interface Member {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  status: string
  gender: string | null
  city: string | null
  family: { name: string } | null
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    gender: "", city: "", address: "", maritalStatus: "",
    occupation: "", dateOfBirth: "", joinedDate: "",
  })

  function loadMembers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    fetch(`/api/members?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setMembers(d.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMembers() }, [search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ firstName: "", lastName: "", phone: "", email: "", gender: "", city: "", address: "", maritalStatus: "", occupation: "", dateOfBirth: "", joinedDate: "" })
      loadMembers()
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Member"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
              <input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Marital Status" value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input type="date" value={form.joinedDate} onChange={(e) => setForm({ ...form, joinedDate: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Member</button>
          </form>
        )}

        <input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2"
        />

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.firstName} {m.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.gender || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.city || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No members found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}