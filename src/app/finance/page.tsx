"use client"

import { useEffect, useState, FormEvent } from "react"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })
}

function ContributionTab() {
  const [contributions, setContributions] = useState<Array<{ id: string; type: string; amount: number; date: string; member: { firstName: string; lastName: string } }>>([])
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ type: "TITHE", amount: "", date: new Date().toISOString().split("T")[0], memberId: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(`/api/contributions?page=${page}`)
        const res = await r.json()
        if (!cancelled && res.success) { setContributions(res.data.contributions); setTotal(res.data.total) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    async function loadMembers() {
      try {
        const r = await fetch("/api/members?limit=200")
        const res = await r.json()
        if (!cancelled && res.success) setMembers(res.data.members)
      } catch { /* ignore */ }
    }
    load()
    loadMembers()
    return () => { cancelled = true }
  }, [page, refreshKey])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    const data = await res.json()
    if (data.success) { setShowForm(false); setForm({ type: "TITHE", amount: "", date: new Date().toISOString().split("T")[0], memberId: "", notes: "" }); setRefreshKey((k) => k + 1) }
    setSaving(false)
  }

  const typeColor: Record<string, string> = {
    TITHE: "bg-blue-100 text-blue-800",
    OFFERING: "bg-green-100 text-green-800",
    PLEDGE: "bg-purple-100 text-purple-800",
    SPECIAL_DONATION: "bg-amber-100 text-amber-800",
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowForm(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Record Contribution
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold text-gray-800">New Contribution</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option value="TITHE">Tithe</option>
                  <option value="OFFERING">Offering</option>
                  <option value="PLEDGE">Pledge</option>
                  <option value="SPECIAL_DONATION">Special Donation</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount (NGN)</label>
                <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Member</label>
                <select required value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select member</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.lastName}, {m.firstName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : contributions.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No contributions yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-2 font-medium text-gray-500">Member</th>
                <th className="p-2 font-medium text-gray-500">Type</th>
                <th className="p-2 font-medium text-gray-500">Amount</th>
                <th className="p-2 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-2 font-medium">{c.member.lastName}, {c.member.firstName}</td>
                  <td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[c.type] || "bg-gray-100"}`}>{c.type}</span></td>
                  <td className="p-2 font-medium">{formatCurrency(c.amount)}</td>
                  <td className="p-2 text-gray-500">{formatDate(c.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <span className="text-sm text-gray-500">{total} records</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Prev</button>
          <span className="py-1 text-sm text-gray-600">Page {page}</span>
          <button disabled={contributions.length < 20} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}

function ExpenseTab() {
  const [expenses, setExpenses] = useState<Array<{ id: string; description: string; amount: number; category: string; date: string; approvedBy?: { firstName: string; lastName: string } | null; recordedBy: { firstName: string; lastName: string } }>>([])
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ description: "", amount: "", category: "", date: new Date().toISOString().split("T")[0], notes: "" })
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(`/api/expenses?page=${page}`)
        const res = await r.json()
        if (!cancelled && res.success) { setExpenses(res.data.expenses); setTotal(res.data.total) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, refreshKey])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    const data = await res.json()
    if (data.success) { setShowForm(false); setRefreshKey((k) => k + 1) }
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowForm(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Record Expense
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold text-gray-800">New Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount (NGN)</label>
                <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Utilities, Salaries" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No expenses yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-2 font-medium text-gray-500">Description</th>
                <th className="p-2 font-medium text-gray-500">Category</th>
                <th className="p-2 font-medium text-gray-500">Amount</th>
                <th className="p-2 font-medium text-gray-500">Date</th>
                <th className="p-2 font-medium text-gray-500">Recorded By</th>
                <th className="p-2 font-medium text-gray-500">Approved</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-2 font-medium">{e.description}</td>
                  <td className="p-2 text-gray-600">{e.category}</td>
                  <td className="p-2 font-medium">{formatCurrency(e.amount)}</td>
                  <td className="p-2 text-gray-500">{formatDate(e.date)}</td>
                  <td className="p-2 text-gray-600">{e.recordedBy.firstName} {e.recordedBy.lastName}</td>
                  <td className="p-2">
                    {e.approvedBy ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Approved</span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <span className="text-sm text-gray-500">{total} records</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Prev</button>
          <span className="py-1 text-sm text-gray-600">Page {page}</span>
          <button disabled={expenses.length < 20} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [tab, setTab] = useState<"contributions" | "expenses">("contributions")

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Finance</h1>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("contributions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "contributions" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Contributions
        </button>
        <button
          onClick={() => setTab("expenses")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "expenses" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Expenses
        </button>
      </div>

      {tab === "contributions" ? <ContributionTab /> : <ExpenseTab />}
    </div>
  )
}
