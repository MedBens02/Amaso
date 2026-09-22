"use client"

import { useEffect } from "react"

/**
 * Stop a page walking away from work that was typed but not saved.
 *
 * The marks on the registrations screen are edited straight into the table
 * and held there until the save button is pressed, so a click on anything
 * in the sidebar threw the lot away without a word. This asks first.
 *
 * Two routes out of a page, two listeners. Closing or reloading the browser
 * is `beforeunload`, which shows the browser's own wording - the message
 * below reaches it in no current browser, but the prompt still appears.
 * Moving to another page inside the app never touches `beforeunload` at
 * all: it is a click on a link that next/link turns into a client-side
 * navigation, so the click is caught instead.
 *
 * The click listener runs in the capture phase on purpose. next/link binds
 * its handler to the anchor itself, and by the time an event bubbled up to
 * the document the navigation would already be under way.
 *
 * The browser's back button is not covered. `popstate` arrives after the
 * history entry has already changed, and pushing it back to fake a prompt
 * is the kind of trick that breaks the button for good.
 */
export function useUnsavedChangesWarning(enabled: boolean, message: string) {
  useEffect(() => {
    if (!enabled) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Chrome still wants this set, even though it ignores the text.
      event.returnValue = message
    }

    const onClick = (event: MouseEvent) => {
      // A modified click opens a new tab, which leaves this page as it is.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!anchor || anchor.hasAttribute("download")) return
      if (anchor.target && anchor.target !== "_self") return

      const href = anchor.getAttribute("href") ?? ""
      if (href.startsWith("#")) return

      const url = new URL(anchor.href, window.location.href)
      // Another site is the browser's own prompt, above; the same page is
      // not going anywhere.
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return

      if (window.confirm(message)) return

      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [enabled, message])
}

/** One place for the wording, so every screen that guards marks agrees. */
export const UNSAVED_GRADES_MESSAGE =
  "لديك نقط لم تُحفظ بعد. إذا غادرت هذه الصفحة ستفقدها. هل تريد المتابعة؟"

/** The same warning where what is being left is a dialog, not a page. */
export const UNSAVED_GRADES_CLOSE_MESSAGE =
  "لديك نقط لم تُحفظ بعد. إذا أغلقت هذه النافذة ستفقدها. هل تريد المتابعة؟"
