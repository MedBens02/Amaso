"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bus, CalendarDays, GraduationCap, ListOrdered, School } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Education is five screens, not five tabs.
 *
 * It was one page with four tabs, and the transport tab had two tabs of its
 * own inside it - so settling a month meant a tab inside a tab inside the
 * dashboard, and nothing you were looking at had an address you could
 * return to or send to somebody. Each screen is a page now, and the strip
 * below is a link bar rather than tab state, so the browser's back button
 * and a bookmark both do what they look like they do.
 */
const PAGES = [
  { href: "/dashboard/education", label: "التسجيلات", icon: GraduationCap },
  { href: "/dashboard/education/transport", label: "النقل", icon: Bus },
  { href: "/dashboard/education/schools", label: "المؤسسات", icon: School },
  { href: "/dashboard/education/years", label: "السنوات الدراسية", icon: CalendarDays },
  { href: "/dashboard/education/levels", label: "المستويات", icon: ListOrdered },
]

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">التتبع الدراسي</h1>
        <p className="text-muted-foreground mt-2">
          تتبع مسار الأيتام الدراسي سنة بسنة، من التمدرس الأول إلى التخرج من الجامعة، وما يرافقه من دعم ونقل
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {PAGES.map((page) => {
          // Not startsWith: every page starts with the enrollments path, so
          // that would light all five up at once.
          const isActive = pathname === page.href

          return (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <page.icon className="h-4 w-4" />
              {page.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
