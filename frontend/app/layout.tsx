import type React from "react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RadixPointerEventsGuard } from "@/components/radix-pointer-events-guard"
// Side-effect only: installs the fetch() auth patch (see lib/api.ts) before
// any page's components can make an unauthenticated raw fetch() call.
import "@/lib/api"

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
})

export const metadata: Metadata = {
  title: "جمعية المنصور لكفالة اليتيم — AMASO",
  description: "نظام شامل لإدارة الأرامل والأيتام والخدمات التعليمية",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="font-cairo" suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false} 
          disableTransitionOnChange
          storageKey="amaso-theme"
        >
          {children}
          {/* Global toast outlet - without it every toast() in the app is invisible */}
          <Toaster />
          {/* Releases the body pointer-events lock Radix can leave behind */}
          <RadixPointerEventsGuard />
        </ThemeProvider>
      </body>
    </html>
  )
}
