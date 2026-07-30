"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

const navItems = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Members", href: "/members", icon: "👥" },
  { label: "Finance", href: "/finance", icon: "💰" },
  { label: "Communication", href: "/communication", icon: "📨" },
  { label: "Follow-up", href: "/followup", icon: "📋" },
  { label: "Volunteers", href: "/volunteers", icon: "🙋" },
  { label: "Branches", href: "/branches", icon: "🏛️" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside
      className={`flex min-h-screen flex-col bg-gray-900 text-white transition-all ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        {!collapsed && <span className="text-xl font-bold">ChurchOS</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 hover:bg-gray-700"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700 p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}