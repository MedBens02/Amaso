"use client"

import { useEffect, useRef, useState } from "react"
import {
  type LucideIcon,
  BookOpen,
  HeartPulse,
  Palette,
  Hammer,
  GraduationCap,
  Settings2,
  ShoppingBasket,
} from "lucide-react"

/**
 * The seven parts a comprehensive sponsorship is split into.
 *
 * These mirror the fixed split the system enforces (KafalaChamilaSplit), which
 * is the association's most distinctive commitment: a sponsor knows in advance
 * exactly where every dirham goes, and the shares cannot be quietly changed.
 */
const PARTS: Array<{
  key: string
  label: string
  percentage: number
  icon: LucideIcon
  color: string
  blurb: string
}> = [
  { key: "maouna", label: "مؤونة", percentage: 50, icon: ShoppingBasket, color: "#0d9488", blurb: "سلة غذائية شهرية ولوازم المنزل" },
  { key: "education", label: "تعليم", percentage: 20, icon: BookOpen, color: "#0891b2", blurb: "رسوم التمدرس واللوازم المدرسية" },
  { key: "management", label: "تسيير", percentage: 10, icon: Settings2, color: "#64748b", blurb: "ما تحتاجه الجمعية لتصل المساعدة" },
  { key: "projects", label: "مشاريع", percentage: 6, icon: Hammer, color: "#b45309", blurb: "مشاريع مدرّة للدخل تُخرج الأسرة من الحاجة" },
  { key: "activities", label: "تربية وترفيه", percentage: 5, icon: Palette, color: "#c026d3", blurb: "أنشطة ورحلات ليبقى الطفل طفلاً" },
  { key: "formation", label: "تكوين", percentage: 5, icon: GraduationCap, color: "#7c3aed", blurb: "تكوين مهني للأم والأبناء الكبار" },
  { key: "health", label: "صحة", percentage: 4, icon: HeartPulse, color: "#e11d48", blurb: "أدوية ومصاريف العلاج" },
]

const TOTAL = 800

/**
 * The sponsorship, opened up.
 *
 * Bars grow from zero when the section is first reached, so the reader watches
 * the sum being divided rather than reading a static table.
 */
export function KafalaSplit() {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      setLive(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      {/* the seven shares */}
      <div className="space-y-3">
        {PARTS.map((part, index) => {
          const amount = Math.round((TOTAL * part.percentage) / 100)
          const Icon = part.icon
          const isActive = active === part.key

          return (
            <button
              key={part.key}
              type="button"
              onMouseEnter={() => setActive(part.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(part.key)}
              onBlur={() => setActive(null)}
              className={`group w-full rounded-2xl border p-4 text-right transition-all duration-300 ${
                isActive
                  ? "border-transparent bg-white shadow-lg shadow-teal-900/5 dark:bg-slate-800"
                  : "border-slate-200/70 bg-white/60 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${part.color}1a`, color: part.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{part.label}</span>
                    <span className="shrink-0 font-mono text-sm text-slate-500 dark:text-slate-400">
                      {amount} د.م · <span dir="ltr">{part.percentage}%</span>
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none"
                      style={{
                        width: live ? `${part.percentage}%` : "0%",
                        backgroundColor: part.color,
                        transitionDelay: `${index * 90}ms`,
                      }}
                    />
                  </div>

                  <p
                    className={`overflow-hidden text-sm text-slate-500 transition-all duration-300 dark:text-slate-400 ${
                      isActive ? "mt-2 max-h-10 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {part.blurb}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* the whole, for context */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-8 text-white shadow-xl shadow-teal-900/20">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -right-6 h-44 w-44 rounded-full bg-amber-400/20 blur-2xl" />

          <div className="relative">
            <p className="text-sm text-teal-100">الكفالة الشاملة</p>
            <p className="mt-1 text-5xl font-bold tracking-tight">
              800 <span className="text-2xl font-medium text-teal-100">د.م</span>
            </p>
            <p className="mt-1 text-sm text-teal-100">شهرياً لأسرة واحدة</p>

            <div className="mt-6 h-px bg-white/20" />

            <ul className="mt-6 space-y-3 text-sm text-teal-50">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                النسب ثابتة ومسجَّلة في النظام — لا تُغيَّر من حالة لأخرى.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                لكل كفيل كشف يبيّن أين ذهب نصيب كل بند.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                يمكن كفالة أسرة كاملة أو المشاركة في كفالتها.
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  )
}
