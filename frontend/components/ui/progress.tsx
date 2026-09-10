"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    {/* Sized by width rather than shifted by translateX.
        A full-width bar pushed sideways by `translateX(-(100 - value)%)`
        fills from the left whatever the writing direction, because
        translateX is a physical axis - so in this right-to-left app every
        progress bar grew from the wrong edge. A plain width leaves the
        anchoring to the flow direction, which puts it on the right here and
        on the left in a left-to-right context, and still animates. */}
    <ProgressPrimitive.Indicator
      className="h-full bg-primary transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
