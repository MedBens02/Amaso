"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Fades and lifts its children in as they scroll into view, and again each
 * time they come back.
 *
 * An IntersectionObserver rather than an animation library: the page needs one
 * effect, and pulling in a runtime for it would cost more than the effect is
 * worth. Content is visible from the first paint and the transition only ever
 * removes the offset, so nothing is hidden if JavaScript never runs.
 *
 * This used to reveal once and disconnect. That is the usual behaviour for a
 * reveal-on-scroll, but on a page this length it meant one scroll past the
 * fold armed everything at once and the rest of the visit was static - the
 * effect could only be seen again by reloading. The observer now stays
 * attached and the element re-arms when it has fully left the viewport, so
 * scrolling back up and down plays it again.
 *
 * `once` opts back into the old behaviour for anything that should settle
 * permanently. `prefers-reduced-motion` skips the whole thing: for a reader
 * who has asked for less movement, repeating an animation is worse than
 * playing it once.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  once = false,
}: {
  children: ReactNode
  delay?: number
  className?: string
  once?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (typeof IntersectionObserver === "undefined" || reducedMotion) {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          if (once) observer.disconnect()
          return
        }

        // Re-arm only once the element is genuinely out of sight. Reacting to
        // any drop below the reveal threshold would make things flicker as
        // they clip the edge of the viewport on the way past.
        if (!once && entry.intersectionRatio === 0) {
          setShown(false)
        }
      },
      // Two thresholds: 0 tells us when it has fully left, 0.12 when enough
      // of it has arrived to be worth revealing.
      { threshold: [0, 0.12], rootMargin: "0px 0px -60px 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
