"use client"

import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction"
import type React from "react"

/**
 * Tells every Radix primitive that the app reads right to left.
 *
 * `<html dir="rtl">` is not enough on its own. Radix resolves direction from
 * its own React context, not from the DOM, and several primitives write the
 * answer back out as a `dir` attribute on the element they render. With no
 * provider that answer is always "ltr", so a <Tabs> - which stamps `dir` on
 * its root - silently flipped everything inside it back to left-to-right.
 * That is what made the widow card read as a jumble: the dialog around it was
 * RTL, the tab body inside it was not, and labels, icons and values were
 * being laid out from opposite edges on the same screen.
 *
 * Mounted once at the root so the whole tree gets the same answer. Anything
 * that genuinely needs to be LTR still overrides it with its own `dir` prop,
 * which wins over this.
 */
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  return <RadixDirectionProvider dir="rtl">{children}</RadixDirectionProvider>
}
