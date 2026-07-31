"use client"

import { useEffect, useState } from "react"

interface DashboardData {
  totalMembers: number
  activeMembers: number
  newThisMonth: number
  totalContributions: number
  totalExpenses: number
  pendingFollowUps: number
  thisWeekAttendance: number
  recentContributions: Array<{
    id: string
    type: string
    amount: number
    date: string
    member: { firstName: string; lastName: string }
  }>
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-6 text-gray-500">Failed to load dashboard</div>

  const kpis = [
    { label: "Total Members", value: data.totalMembers, sub: `${data.activeMembers} active`, color: "bg-blue-500" },
    { label: "Monthly Giving", value: formatCurrency(data.totalContributions), sub: `${data.newThisMonth} new members`, color: "bg-green-500" },
    { label: "Monthly Expenses", value: formatCurrency(data.totalExpenses), sub: null, color: "bg-amber-500" },
    { label: "Pending Follow-ups", value: data.pendingFollowUps, sub: `${data.thisWeekAttendance} attended this week`, color: "bg-red-500" },
  ]

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${kpi.color}`} />
              <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{kpi.value}</div>
            {kpi.sub && <div className="mt-1 text-xs text-gray-400">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Recent Contributions</h2>
        {data.recentContributions.length === 0 ? (
          <p className="text-sm text-gray-500">No contributions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">Member</th>
                  <th className="pb-2 font-medium text-gray-500">Type</th>
                  <th className="pb-2 font-medium text-gray-500">Amount</th>
                  <th className="pb-2 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentContributions.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="py-2">{c.member.firstName} {c.member.lastName}</td>
                    <td className="py-2">
                      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-2 font-medium">{formatCurrency(c.amount)}</td>
                    <td className="py-2 text-gray-500">{formatDate(c.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
