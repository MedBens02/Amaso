"use client"

import Image from "next/image"

/**
 * The association's logo.
 *
 * The file at /amaso-logo.png is the single place to swap it — replacing that
 * one file updates the header, the hero and the footer together. It is
 * currently an upscale of a small JPEG original, so it will sharpen on its own
 * once a proper transparent version lands in its place.
 *
 * `animate` gives the hero copy a slow lift so the page keeps its pulse now
 * that the mark is a bitmap rather than something that can be animated from
 * the inside.
 */
export function Logo({
  className = "",
  size = 44,
  animate = false,
  priority = false,
  plate = true,
}: {
  className?: string
  size?: number
  animate?: boolean
  priority?: boolean
  /**
   * Sits the mark on a white rounded card. The current file carries a white
   * square background, which would otherwise show as a hard edge against the
   * tinted hero and the dark footer; the plate makes that edge deliberate, and
   * still frames the mark correctly once a transparent version replaces it.
   */
  plate?: boolean
}) {
  return (
    <span
      className={`amaso-logo relative inline-block overflow-hidden ${
        plate ? "rounded-2xl bg-white p-[6%] shadow-sm ring-1 ring-black/5" : ""
      } ${animate ? "is-animated" : ""} ${className}`}
    >
      <Image
        src="/amaso-logo.png"
        alt="شعار الجمعية"
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain"
      />
      <style jsx>{`
        .is-animated {
          animation: amaso-float 5.5s ease-in-out infinite;
        }
        @keyframes amaso-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .is-animated {
            animation: none;
          }
        }
      `}</style>
    </span>
  )
}
