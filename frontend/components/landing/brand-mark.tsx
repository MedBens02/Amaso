"use client"

/**
 * The association's mark, drawn rather than bitmapped: two cupped hands
 * raising a child between them.
 *
 * The logo on file is a 150px JPEG that goes soft at any real size, so the
 * motif is rebuilt as vector here — crisp at hero scale, and able to carry the
 * slow lift that gives the page its pulse.
 *
 * Each hand is a palm plus four fingers of graded length, grouped and rotated
 * inward, which keeps the silhouette readable down to favicon size where a
 * more literal drawing would turn to mud.
 */

/** Finger lengths, thumb-side outward, as (x offset, height). */
const FINGERS: Array<[number, number]> = [
  [0, 44],
  [15, 56],
  [30, 60],
  [45, 50],
]

function Hand({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <g transform={mirrored ? "translate(206,0) scale(-1,1) rotate(-21 62 152)" : "translate(-6,0) rotate(-21 62 152)"}>
      {/* fingers, tucked behind the palm so the joins never show */}
      {FINGERS.map(([dx, height]) => (
        <rect key={dx} x={30 + dx} y={130 - height} width="15" height={height + 20} rx="7.5" />
      ))}
      {/* palm */}
      <rect x="24" y="118" width="72" height="76" rx="34" />
    </g>
  )
}

export function BrandMark({
  className = "",
  animate = false,
}: {
  className?: string
  animate?: boolean
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="شعار الجمعية">
      <defs>
        <linearGradient id="amasoHand" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0e5f73" />
        </linearGradient>
        <linearGradient id="amasoChild" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* the child, lifted: head, arms raised in a V, body */}
      <g className={animate ? "amaso-child" : undefined} fill="url(#amasoChild)">
        <circle cx="100" cy="34" r="17" />
        <rect x="93" y="58" width="14" height="52" rx="7" />
        <rect x="70" y="52" width="13" height="42" rx="6.5" transform="rotate(-32 76 73)" />
        <rect x="117" y="52" width="13" height="42" rx="6.5" transform="rotate(32 124 73)" />
      </g>

      {/* the hands, meeting beneath */}
      <g fill="url(#amasoHand)">
        <Hand />
        <Hand mirrored />
      </g>

      <style jsx>{`
        .amaso-child {
          transform-origin: 100px 110px;
          animation: amaso-lift 5.5s ease-in-out infinite;
        }
        @keyframes amaso-lift {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(2.5deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .amaso-child {
            animation: none;
          }
        }
      `}</style>
    </svg>
  )
}
