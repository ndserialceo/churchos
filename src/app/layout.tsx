import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AppLayout } from "@/components/layout/AppLayout"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ChurchOS - Church Management System",
  description: "Multi-branch church management system for Nigerian churches - manage members, finances, attendance, communications, and volunteers",
  keywords: ["church management", "Nigerian church", "member management", "church finance", "attendance tracking"],
  authors: [{ name: "ChurchOS" }],
  openGraph: {
    title: "ChurchOS - Church Management System",
    description: "Multi-branch church management system for Nigerian churches",
    type: "website",
    locale: "en_NG",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
