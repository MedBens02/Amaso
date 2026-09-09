"use client"

/**
 * Flat illustrations that hold the page's image slots until photographs
 * arrive.
 *
 * They are deliberately not the logo: a slot that shows the mark reads as a
 * finished design and never gets replaced, whereas a scene reads as artwork
 * that a real photograph will improve on. Both are built from primitives —
 * circles, rounded rectangles, arcs — so they stay crisp at any size and carry
 * no image weight, and both use the page's own palette (teal, amber, orange)
 * so they sit inside the design rather than beside it.
 *
 * To use a photograph instead, replace the whole <Illustration /> element with
 * an <Image /> of the same 4:3 aspect ratio; nothing else depends on it.
 */

/** A four-point sparkle, used to lift empty corners. */
function Sparkle({ x, y, size = 8, fill = "#fbbf24", opacity = 0.7 }: {
  x: number
  y: number
  size?: number
  fill?: string
  opacity?: number
}) {
  const s = size / 8
  return (
    <path
      transform={`translate(${x},${y}) scale(${s})`}
      d="M0-8C1.5-2.5 2.5-1.5 8 0 2.5 1.5 1.5 2.5 0 8-1.5 2.5-2.5 1.5-8 0-2.5-1.5-1.5-2.5 0-8Z"
      fill={fill}
      opacity={opacity}
    />
  )
}

/** A family outside their home beneath a warm sun — shelter, care, continuity. */
function FamilyScene() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="رسم توضيحي: أسرة أمام بيتها">
      <defs>
        {/* warm at the top, cool at the horizon, so the scene meets the page's cream ground */}
        <linearGradient id="ill-sky-family" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="45%" stopColor="#ecfeff" />
          <stop offset="100%" stopColor="#a5f3fc" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ill-sky-family)" />

      {/* sun and its halo */}
      <circle cx="334" cy="52" r="48" fill="#fbbf24" opacity="0.16" />
      <circle cx="334" cy="52" r="30" fill="#fbbf24" opacity="0.32" />
      <circle cx="334" cy="52" r="19" fill="#f59e0b" />

      {/* drifting clouds */}
      <g fill="#ffffff" opacity="0.8">
        <ellipse cx="66" cy="60" rx="30" ry="13" />
        <ellipse cx="90" cy="53" rx="21" ry="16" />
        <ellipse cx="198" cy="38" rx="24" ry="10" />
        <ellipse cx="212" cy="33" rx="15" ry="11" />
      </g>

      {/* birds */}
      <g stroke="#0e7490" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.45">
        <path d="M244 84c5-6 10-6 15 0" />
        <path d="M266 72c4-5 8-5 12 0" />
      </g>

      {/* far hill */}
      <path d="M0 206c64-20 128-26 196-12s136 14 204-14v120H0Z" fill="#5eead4" opacity="0.6" />

      {/* the home */}
      <g transform="translate(56,140)">
        <path d="M0 26 36 0l36 26v54a7 7 0 0 1-7 7H7a7 7 0 0 1-7-7Z" fill="#f8fafc" />
        <path d="M-8 28 36-5l44 33" fill="none" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="27" y="52" width="18" height="35" rx="3" fill="#0e7490" />
        <circle cx="41" cy="70" r="1.8" fill="#fbbf24" />
        <rect x="8" y="39" width="14" height="14" rx="3" fill="#67e8f9" />
        <rect x="50" y="39" width="14" height="14" rx="3" fill="#67e8f9" />
      </g>

      {/* a tree beside the house */}
      <g transform="translate(176,162)">
        <path d="M-5 68V24h10v44Z" fill="#b45309" />
        <circle cx="0" cy="8" r="28" fill="#0d9488" />
        <circle cx="-19" cy="26" r="19" fill="#14b8a6" />
        <circle cx="19" cy="24" r="17" fill="#14b8a6" />
      </g>

      {/* near hill, in front of house and tree */}
      <path d="M0 244c88-24 156-8 226 2s110 6 174-16v70H0Z" fill="#0f766e" />

      {/* the family: a mother and two children, standing together */}
      <g transform="translate(286,170)">
        {/* mother */}
        <circle cx="0" cy="0" r="15" fill="#134e4a" />
        <path d="M-18 78V32a18 18 0 0 1 36 0v46Z" fill="#134e4a" />
        {/* older child, on her left */}
        <g transform="translate(40,30)">
          <circle cx="0" cy="0" r="12" fill="#ea580c" />
          <path d="M-14 48V22a14 14 0 0 1 28 0v26Z" fill="#ea580c" />
        </g>
        {/* younger child, on her right */}
        <g transform="translate(-40,38)">
          <circle cx="0" cy="0" r="11" fill="#f59e0b" />
          <path d="M-13 40V21a13 13 0 0 1 26 0v19Z" fill="#f59e0b" />
        </g>
      </g>

      {/* grass tufts, for a little texture on the near hill */}
      <g stroke="#134e4a" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none">
        <path d="M52 276v-11M60 276v-14M68 276v-11" />
        <path d="M150 288v-11M158 288v-14" />
        <path d="M356 268v-11M364 268v-14" />
      </g>

      {/* hearts rising from the family */}
      <g fill="#fb7185">
        <path d="M352 140c-3-5-10-2-10 3 0 5 7 9 10 12 3-3 10-7 10-12 0-5-7-8-10-3Z" opacity="0.7" />
        <path d="M376 110c-2-3-7-1-7 2 0 3 5 6 7 8 2-2 7-5 7-8 0-3-5-5-7-2Z" opacity="0.45" />
      </g>
    </svg>
  )
}

/** Books, a cap and a growing seedling — the education programme. */
function LearningScene() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="رسم توضيحي: التعليم">
      <defs>
        <linearGradient id="ill-sky-learning" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#f0fdfa" />
          <stop offset="100%" stopColor="#a5f3fc" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ill-sky-learning)" />

      <circle cx="84" cy="74" r="46" fill="#0d9488" opacity="0.12" />
      <circle cx="326" cy="212" r="54" fill="#f59e0b" opacity="0.14" />

      {/* a pencil, filling the empty corner */}
      <g transform="translate(74,44) rotate(-16)">
        <rect x="-9" y="-12" width="18" height="14" rx="5" fill="#fb7185" />
        <rect x="-9" y="0" width="18" height="66" rx="2" fill="#f59e0b" />
        <rect x="-9" y="54" width="18" height="9" fill="#fbbf24" />
        <path d="M-9 66 0 86 9 66Z" fill="#fde68a" />
        <path d="M-3.5 78 0 86 3.5 78Z" fill="#0f172a" />
      </g>

      {/* stacked books */}
      <g transform="translate(102,166)">
        <rect x="0" y="52" width="180" height="26" rx="6" fill="#0e7490" />
        <rect x="14" y="27" width="152" height="25" rx="6" fill="#0d9488" />
        <rect x="30" y="2" width="122" height="25" rx="6" fill="#f59e0b" />
        <rect x="9" y="61" width="36" height="8" rx="4" fill="#ffffff" opacity="0.55" />
        <rect x="23" y="35" width="32" height="8" rx="4" fill="#ffffff" opacity="0.55" />
        <rect x="39" y="10" width="28" height="8" rx="4" fill="#ffffff" opacity="0.6" />
      </g>

      {/* graduation cap resting on top */}
      <g transform="translate(162,118)">
        <path d="M0 26 57 4l57 22-57 22Z" fill="#0f172a" opacity="0.88" />
        <path d="M23 39v20c0 8 68 8 68 0V39" fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" opacity="0.88" />
        <circle cx="114" cy="26" r="4.5" fill="#ea580c" />
        <path d="M114 26v24" stroke="#ea580c" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* a seedling, because schooling is something you grow */}
      <g transform="translate(296,182)">
        <path d="M22 60V22" stroke="#0d9488" strokeWidth="7" strokeLinecap="round" />
        <path d="M22 36C4 36-4 23-1 12c13-3 23 8 23 24Z" fill="#14b8a6" />
        <path d="M22 46c18-3 26-16 23-27-13-3-23 10-23 27Z" fill="#5eead4" />
        <path d="M0 58h44l-5 33a7 7 0 0 1-7 6H12a7 7 0 0 1-7-6Z" fill="#ea580c" />
        <rect x="-3" y="52" width="50" height="11" rx="5" fill="#f97316" />
      </g>

      <Sparkle x={252} y={68} size={10} />
      <Sparkle x={296} y={104} size={6} opacity={0.5} />
      <Sparkle x={58} y={196} size={8} fill="#14b8a6" opacity={0.45} />
    </svg>
  )
}

export function Illustration({
  variant = "family",
  className = "",
}: {
  variant?: "family" | "learning"
  className?: string
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      {variant === "family" ? <FamilyScene /> : <LearningScene />}
    </div>
  )
}
