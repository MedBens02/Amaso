"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Moon, Sun, User, LogOut, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { logout } from "@/lib/auth"

interface HeaderProps {
  user: {
    name: string
    email: string
    role: string
  }
}

/**
 * Today, Gregorian then Hijri on one line.
 *
 * The Hijri half has to name its calendar: "ar-SA" resolves to the Gregorian
 * calendar in the browsers this runs in, so asking it for a date and adding
 * "هـ" printed the Gregorian date twice, once with a Hijri suffix that made
 * it wrong rather than merely redundant. The Umm al-Qura formatter supplies
 * its own "هـ", and the weekday is dropped from it because it is the same
 * weekday already named on the left.
 */
function formatToday(): string {
  const today = new Date()

  const gregorian = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  })

  const hijri = today.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  })

  return `${gregorian} — ${hijri}`
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  return (
    <header className="bg-background border-b border-border px-6 py-3 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">مرحباً، {user.name}</h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {formatToday()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">تبديل الوضع الليلي</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
            <span className="sr-only">الإشعارات</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {/* There are no per-user photos; the association's mark
                      stands in, and initials show if it fails to load. */}
                  <AvatarImage src="/amaso-logo.png" alt="" className="bg-white object-contain p-1" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  router.push("/dashboard/profile")
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>الملف الشخصي</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                disabled={signingOut}
                // Keep the menu open for the moment the sign-out takes, so
                // the pending label below is actually visible and a second
                // press lands on a disabled item rather than starting over.
                onSelect={(event) => {
                  event.preventDefault()
                  if (signingOut) return
                  setSigningOut(true)
                  logout()
                }}
              >
                {signingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>{signingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
