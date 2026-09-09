"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Counts from zero to `value` the first time it is scrolled into view.
 *
 * The final value is rendered immediately when the browser cannot observe or
 * the visitor prefers reduced motion, so the figure is never withheld.
 */
export function CountUp({
  value,
  duration = 1600,
  suffix = "",
  className = "",
}: {
  value: number
  duration?: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (reduced || typeof IntersectionObserver === "undefined") {
      setDisplay(value)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          // Ease out so the count decelerates into its final value.
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  )
}
