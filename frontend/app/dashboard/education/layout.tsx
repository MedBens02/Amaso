"use client"

/**
 * Education is five screens, and the sidebar is how you move between them.
 *
 * It was one page with four tabs, and the transport tab had two tabs of its
 * own inside it - so settling a month meant a tab inside a tab inside the
 * dashboard, and nothing you were looking at had an address you could
 * return to or send to somebody. Each screen is its own page now.
 *
 * The strip of links that replaced the tabs has gone too: the sidebar grew
 * a التعليم section listing the same five pages, and two navigations for
 * one set of screens is one more than anybody needs - it just repeated the
 * sidebar a few pixels lower and took a line off every screen.
 */
export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">التتبع الدراسي</h1>
        <p className="text-muted-foreground mt-2">
          تتبع مسار الأيتام الدراسي سنة بسنة، من التمدرس الأول إلى التخرج من الجامعة، وما يرافقه من دعم ونقل
        </p>
      </div>

      {children}
    </div>
  )
}
