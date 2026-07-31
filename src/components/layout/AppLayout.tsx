"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"

const publicPaths = ["/login"]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
