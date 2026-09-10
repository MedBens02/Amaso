"use client"

import { useEffect } from "react"

/**
 * Un-sticks `document.body { pointer-events: none }` when Radix leaves it
 * behind, which reads to the user as the whole page freezing.
 *
 * While a modal overlay is open, Radix locks pointer events on the body so
 * clicks cannot reach the page behind it, and releases the lock when the
 * overlay unmounts. Each overlay does this independently, so when two of
 * them close in the same tick - a Select inside a Dialog, or a Dialog opened
 * from a DropdownMenu - the releases race, and the last one to run can
 * restore a value that was already stale. The body keeps the lock with
 * nothing open to justify it, and every button on the page stops responding
 * until a reload clears the inline style.
 *
 * Rather than fixing that per dialog (which the codebase already does in ten
 * files, with a `setTimeout` that force-writes `pointer-events: auto` after
 * every close), this watches the body for the stuck state and clears it only
 * when nothing is actually open - so it can never unlock the page underneath
 * a modal that is still up.
 */

/**
 * What legitimately holds the lock.
 *
 * Dialog and AlertDialog content carry their role plus `data-state`. Select,
 * DropdownMenu and Popover content are positioned by Radix's popper, so the
 * wrapper identifies them whatever their role. `data-state="open"` is the
 * operative part: an overlay playing its exit animation is already "closed"
 * and no longer has a claim on the lock.
 *
 * Deliberately NOT a bare `[data-state="open"]`: toasts are Radix components
 * too and sit at `data-state="open"` for seconds after an action, which would
 * mask exactly the case this guard exists for (a save that closes a dialog
 * and raises a toast).
 */
const OPEN_OVERLAY = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[data-radix-popper-content-wrapper] [data-state="open"]',
].join(", ")

export function RadixPointerEventsGuard() {
  useEffect(() => {
    const clearIfStuck = () => {
      if (document.body.style.pointerEvents !== "none") return
      if (document.querySelector(OPEN_OVERLAY)) return

      document.body.style.pointerEvents = ""
    }

    // MutationObserver callbacks run once the task that mutated the DOM has
    // finished, so React has committed the whole close - including the
    // effects that unmount the overlay - before this looks at the page.
    const observer = new MutationObserver(clearIfStuck)
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] })

    // A route change can land here with the lock already stuck, in which case
    // no further mutation is coming to trigger the observer.
    clearIfStuck()

    return () => observer.disconnect()
  }, [])

  return null
}
