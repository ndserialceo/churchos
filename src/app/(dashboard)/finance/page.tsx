"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

interface Summary {
  totalContributions: number
  totalExpenses: number
  balance: number
  totalMembers: number
  activeMembers: number
}

interface Member {
  id: string
  firstName: string
  lastName: string
}

interface Contribution {
  id: string
  type: string
  amount: number
  date: string
  member: { firstName: string; lastName: string }
  notes: string | null
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  notes: string | null
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activeTab, setActiveTab] = useState<"contributions" | "expenses">("contributions")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    type: "TITHE", amount: "", date: new Date().toISOString().split("T")[0],
    memberId: "", notes: "",
  })

  function loadData() {
    fetch("/api/finance/summary").then(r => r.json()).then(d => { if (d.success) setSummary(d.data) })
    fetch("/api/finance/contributions").then(r => r.json()).then(d => { if (d.success) setContributions(d.data) })
    fetch("/api/finance/expenses").then(r => r.json()).then(d => { if (d.success) setExpenses(d.data) })
    fetch("/api/members").then(r => r.json()).then(d => { if (d.success) setMembers(d.data) })
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const endpoint = activeTab === "contributions" ? "/api/finance/contributions" : "/api/finance/expenses"
    const body = activeTab === "contributions"
      ? form
      : { description: (form as any).description, amount: form.amount, category: (form as any).category || "General", date: form.date, notes: form.notes }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ type: "TITHE", amount: "", date: new Date().toISOString().split("T")[0], memberId: "", notes: "" })
      loadData()
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Finance</h1>

        {summary && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
              <p className="text-sm text-gray-600">Income (This Month)</p>
              <p className="text-2xl font-bold text-gray-900">₦{summary.totalContributions.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
              <p className="text-sm text-gray-600">Expenses (This Month)</p>
              <p className="text-2xl font-bold text-gray-900">₦{summary.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-2xl font-bold text-gray-900">₦{summary.balance.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("contributions")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "contributions" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Contributions</button>
            <button onClick={() => setActiveTab("expenses")} className={`rounded-md px-4 py-2 text-sm ${activeTab === "expenses" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Expenses</button>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            {showForm ? "Cancel" : `+ Add ${activeTab === "contributions" ? "Contribution" : "Expense"}`}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {activeTab === "contributions" ? (
                <>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required>
                    <option value="TITHE">Tithe</option>
                    <option value="OFFERING">Offering</option>
                    <option value="PLEDGE">Pledge</option>
                    <option value="SPECIAL_DONATION">Special Donation</option>
                  </select>
                  <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required>
                    <option value="">Select Member</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <input placeholder="Description" onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
                  <input placeholder="Category" onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
                </>
              )}
              <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" required />
              <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save</button>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {activeTab === "contributions" ? (
                  <><th className="px-4 py-3 font-medium">Member</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Notes</th></>
                ) : (
                  <><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Notes</th></>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(activeTab === "contributions" ? contributions : expenses).map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {activeTab === "contributions" ? (
                    <><td className="px-4 py-3 font-medium text-gray-900">{item.member?.firstName} {item.member?.lastName}</td><td className="px-4 py-3 text-gray-600">{item.type}</td></>
                  ) : (
                    <><td className="px-4 py-3 font-medium text-gray-900">{item.description}</td><td className="px-4 py-3 text-gray-600">{item.category}</td></>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">₦{item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{item.notes || "-"}</td>
                </tr>
              ))}
              {(activeTab === "contributions" ? contributions : expenses).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}