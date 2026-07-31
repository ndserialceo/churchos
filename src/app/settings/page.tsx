"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  branch: { id: string; name: string }
}

interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  isActive: boolean
  branchId: string
  branch: { id: string; name: string; code: string }
}

const ROLES = ["SUPER_ADMIN", "BRANCH_ADMIN", "PASTOR", "SECRETARY", "TREASURER"]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "profile">("users")
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "SECRETARY",
  })

  useEffect(() => {
    let cancelled = false
    async function loadUsers() {
      try {
        const r = await fetch("/api/users")
        const d = await r.json()
        if (!cancelled && d.success) setUsers(d.data)
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }
    async function loadProfile() {
      try {
        const r = await fetch("/api/auth/me")
        const d = await r.json()
        if (!cancelled && d.success) setCurrentUser(d.data)
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    if (activeTab === "users") loadUsers()
    if (activeTab === "profile") loadProfile()
    return () => { cancelled = true }
  }, [activeTab])

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ firstName: "", lastName: "", email: "", password: "", phone: "", role: "SECRETARY" })
      setLoadingUsers(true)
      const r = await fetch("/api/users")
      const d = await r.json()
      if (d.success) setUsers(d.data)
      setLoadingUsers(false)
    } else {
      setFormError(data.error || "Failed to create user")
    }
  }

  return (
    <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === "users" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === "profile" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Profile
          </button>
        </div>

        {activeTab === "users" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {showForm ? "Cancel" : "+ Add User"}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreateUser} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
                {formError && (
                  <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</div>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                  <input
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                  <input
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                  <input
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2"
                  />
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2"
                    required
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Create User
                </button>
              </form>
            )}

            {loadingUsers ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-gray-600">{u.role.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{u.branch?.name || "-"}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
            {loadingProfile ? (
              <p className="text-gray-500">Loading...</p>
            ) : currentUser ? (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{currentUser.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                    <p className="text-gray-900">{currentUser.role.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Branch</label>
                    <p className="text-gray-900">{currentUser.branch?.name} ({currentUser.branch?.code})</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        currentUser.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {currentUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Unable to load profile information</p>
            )}
          </div>
        )}
      </div>
  )
}
