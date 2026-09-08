"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import api from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!api.isAuthenticated) {
      router.push("/login")
      return
    }

    // Render immediately from the cached profile so navigation feels
    // instant, then quietly re-validate against the server in the
    // background. A dead/expired token is caught centrally by the API
    // client (401 -> redirect to /login) the moment getMe() runs.
    const cached = localStorage.getItem("user")
    if (cached) {
      try {
        setUser(JSON.parse(cached))
        setLoading(false)
      } catch {
        localStorage.removeItem("user")
      }
    }

    api
      .getMe()
      .then((response) => {
        setUser(response.data)
        localStorage.setItem("user", JSON.stringify(response.data))
        setLoading(false)
      })
      .catch(() => {
        // A 401 already triggered a redirect inside the API client. Any
        // other error (e.g. the backend being briefly unreachable) just
        // keeps whatever we rendered from cache above.
      })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
