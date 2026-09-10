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
      className={`amaso-logo relative overflow-hidden ${
        plate
          ? "inline-flex items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
          : "inline-block"
      } ${animate ? "is-animated" : ""} ${className}`}
    >
      {/* The inset used to be `p-[6%]` on this span. Percentage padding
          resolves against the containing block's width, not the element's
          own — so the same plated logo that sits correctly in a tight flex
          row shrank to a 10px dot inside a wide column, where 6% was a
          quarter of the available box. Insetting the image itself instead
          keeps the proportion at every size and in any container. */}
      <Image
        src="/amaso-logo.png"
        alt="شعار الجمعية"
        width={size}
        height={size}
        priority={priority}
        className={plate ? "h-[88%] w-[88%] object-contain" : "h-full w-full object-contain"}
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
