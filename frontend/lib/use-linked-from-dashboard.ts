"use client"

import { useEffect } from "react"

/**
 * Lets a dashboard button land on a screen already doing the thing it said.
 *
 * "إيراد جديد" used to mean "the income list, now find the button"; "16
 * بانتظار الاعتماد" meant "the income list, now set the filter". The
 * dashboard links carry ?new=1 or ?status=Draft instead, and the screen acts
 * on them once.
 *
 * Read from window.location rather than useSearchParams, for the reason the
 * expenses screen gives: under the static export that hook forces the page
 * into a Suspense boundary at build time.
 *
 * The parameters are taken back out of the address afterwards, so refreshing
 * the page or coming back to it does not open the form a second time. Only
 * these two are removed - anything else in the query string belongs to
 * somebody else.
 */
const STATUSES = ["Draft", "Approved"] as const

export function useLinkedFromDashboard(handlers: {
  onNew?: () => void
  onStatus?: (status: (typeof STATUSES)[number]) => void
}) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    const wantsNew = url.searchParams.get("new") === "1"
    const status = url.searchParams.get("status")

    if (wantsNew && handlers.onNew) handlers.onNew()
    if (status && handlers.onStatus && (STATUSES as readonly string[]).includes(status)) {
      handlers.onStatus(status as (typeof STATUSES)[number])
    }

    if (url.searchParams.has("new") || url.searchParams.has("status")) {
      url.searchParams.delete("new")
      url.searchParams.delete("status")
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
    }
    // Once, on arrival. The handlers are fresh closures every render and
    // re-running this on each would reopen the form the user just closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
