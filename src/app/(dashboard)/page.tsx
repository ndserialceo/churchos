"use client"

import Sidebar from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  contributionsThisMonth: number
  pendingFollowUps: number
  totalVolunteers: number
  totalBranches: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/branches/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Members" value={stats?.totalMembers ?? 0} color="blue" />
            <StatCard label="Active Members" value={stats?.activeMembers ?? 0} color="green" />
            <StatCard label="Monthly Contributions" value={`₦${(stats?.contributionsThisMonth ?? 0).toLocaleString()}`} color="yellow" />
            <StatCard label="Pending Follow-ups" value={stats?.pendingFollowUps ?? 0} color="red" />
            <StatCard label="Active Volunteers" value={stats?.totalVolunteers ?? 0} color="purple" />
            <StatCard label="Branches" value={stats?.totalBranches ?? 0} color="indigo" />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <QuickActionCard
            title="Quick Actions"
            actions={[
              { label: "Add New Member", href: "/members" },
              { label: "Record Contribution", href: "/finance" },
              { label: "Send Communication", href: "/communication" },
              { label: "Log Visitation", href: "/followup" },
            ]}
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  const colors: Record<string, string> = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    yellow: "border-yellow-500 bg-yellow-50",
    red: "border-red-500 bg-red-50",
    purple: "border-purple-500 bg-purple-50",
    indigo: "border-indigo-500 bg-indigo-50",
  }

  return (
    <div className={`rounded-lg border-l-4 p-6 shadow-sm ${colors[color] || colors.blue}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function QuickActionCard({
  title,
  actions,
}: {
  title: string
  actions: { label: string; href: string }[]
}) {
  const router = useRouter()
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="w-full rounded-md bg-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-200"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}