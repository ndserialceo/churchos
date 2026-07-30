"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

interface Branch {
  id: string
  name: string
  code: string
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  _count: { members: number; users: number; contributions: number }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", address: "", city: "", state: "", phone: "", email: "" })

  function loadBranches() {
    setLoading(true)
    fetch("/api/branches")
      .then(r => r.json())
      .then(d => { if (d.success) setBranches(d.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBranches() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ name: "", code: "", address: "", city: "", state: "", phone: "", email: "" })
      loadBranches()
    } else {
      alert(data.error || "Failed to create branch")
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Branch Oversight</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">{showForm ? "Cancel" : "+ Add Branch"}</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input placeholder="Branch Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
              <input placeholder="Branch Code (e.g. LAG001)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
              <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Create Branch</button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {branches.map((b) => (
              <div key={b.id} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{b.name}</h2>
                    <p className="text-sm text-gray-500">{b.code} &middot; {b.city || "N/A"}{b.state ? `, ${b.state}` : ""}</p>
                  </div>
                </div>

                {b.phone && <p className="text-sm text-gray-600">📞 {b.phone}</p>}
                {b.email && <p className="text-sm text-gray-600">✉️ {b.email}</p>}

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{b._count.members}</p>
                    <p className="text-xs text-gray-500">Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{b._count.users}</p>
                    <p className="text-xs text-gray-500">Staff</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{b._count.contributions}</p>
                    <p className="text-xs text-gray-500">Contributions</p>
                  </div>
                </div>
              </div>
            ))}
            {branches.length === 0 && (
              <p className="col-span-full text-center text-gray-500">No branches yet</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}