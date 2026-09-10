"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Light/dark switch.
 *
 * Lives here rather than inside the dashboard header because the public
 * landing page and the login screen need it too - before this existed the
 * theme could only be changed once you were already signed in, which left
 * anyone who preferred dark mode staring at a bright login page to get to it.
 *
 * `mounted` guards against a hydration mismatch: the resolved theme is only
 * known in the browser, so the icons render in their light-mode position on
 * the server and would otherwise disagree with the client on first paint.
 */
export function ThemeToggle({
  className,
  variant = "ghost",
}: {
  className?: string
  variant?: "ghost" | "outline"
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant={variant}
      size="sm"
      aria-label={isDark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("relative", className)}
    >
      {/* Both icons are always mounted and cross-fade, so the button never
          changes size as the theme flips. */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        {mounted ? (isDark ? "الوضع النهاري" : "الوضع الليلي") : "تبديل الوضع"}
      </span>
    </Button>
  )
}
