"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/roles"
import api from "@/lib/api"
import type { DashboardData } from "@/components/dashboard/role/types"
import {
  AccountantDashboard,
  AdminDashboard,
  EducationOfficerDashboard,
  SocialWorkerDashboard,
} from "@/components/dashboard/role/dashboards"

/**
 * The home screen - a different one for each role.
 *
 * It used to be one dashboard for everybody, which meant the education
 * officer opened the books every morning and the accountant scrolled past
 * school transport to reach the drafts waiting on her. Each role now leads
 * with its own work: what is waiting on them, the figures for their part of
 * the association, and the buttons for what they do most.
 *
 * The figures come from one request, GET /dashboard, which computes only
 * the sections the caller's role is shown - see DashboardService. Which
 * dashboard to draw is decided from the same role the server used, so the
 * two cannot disagree about who is looking.
 *
 * The screen this replaced in turn is still at dashboard-old/, off the menu.
 */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // Read after mount, like the sidebar: there is no signed-in user during
  // the static export's server render, and guessing would flash the wrong
  // dashboard for a frame.
  const [role, setRole] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await api.getDashboard()
      setData(response.data)
      // The server's answer wins over the cached profile: if an account's
      // role was changed while it was signed in, this is where it shows.
      setRole(response.data.role)
    } catch (err) {
      console.error("Error loading dashboard:", err)
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات لوحة التحكم")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRole(getCurrentUser()?.role ?? null)
    load()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>تعذر تحميل البيانات</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={load}>
            إعادة المحاولة
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Before the role is known, draw nothing that names one - a frame of
  // "لوحة الإدارة" in front of the education officer is a frame too many.
  if (role === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const props = { data, loading, onRefresh: load, role }

  switch (role) {
    case "accountant":
      return <AccountantDashboard {...props} />
    case "social_worker":
      return <SocialWorkerDashboard {...props} />
    case "education_officer":
      return <EducationOfficerDashboard {...props} />
    case "superuser":
      return <AdminDashboard {...props} superuser />
    default:
      // admin, and anything unrecognised: the overview shows everything a
      // signed-in account may read, which is the safe thing to fall back to.
      return <AdminDashboard {...props} />
  }
}
