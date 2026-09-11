"use client"

import type { LucideIcon } from "lucide-react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type RowAction = {
  label: string
  icon: LucideIcon
  onSelect: () => void
  disabled?: boolean
  /** Red, and pushed below a separator at the end of the menu. */
  destructive?: boolean
  /** Stays an icon button beside the menu. Use for at most one per row. */
  primary?: boolean
  /** Not rendered at all - simpler at the call sites than filtering. */
  hidden?: boolean
}

/**
 * One menu for everything a row can do.
 *
 * Every table had grown its own strip of five or six icon buttons, which cost
 * 150-240px of width each - enough that several tables scrolled sideways and
 * the columns holding the actual data were squeezed to fit. Worse, an icon on
 * its own says nothing: there is no way to tell "print the family card" from
 * "the family's financial report" except by hovering each one in turn.
 *
 * A labelled menu costs one 32px button, says what each action is in words,
 * and gives destructive actions somewhere to sit apart from the rest. Rows
 * whose main action is "open this" pair it with a click on the row itself, so
 * the common case needs no aiming at all.
 *
 * `primary` is the escape hatch for a row where one action really is worth a
 * button of its own - a pending approval, say. Two at most, or the strip is
 * back.
 */
export function RowActions({
  actions,
  align = "end",
  className,
  label = "إجراءات",
}: {
  actions: RowAction[]
  align?: "start" | "center" | "end"
  className?: string
  label?: string
}) {
  const visible = actions.filter((action) => !action.hidden)
  const inline = visible.filter((action) => action.primary)
  const menu = visible.filter((action) => !action.primary)
  const ordinary = menu.filter((action) => !action.destructive)
  const destructive = menu.filter((action) => action.destructive)

  if (visible.length === 0) return null

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {inline.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="outline"
          className="h-8 w-8 shrink-0 p-0"
          disabled={action.disabled}
          title={action.label}
          onClick={(event) => {
            // Rows are often clickable themselves; the button has to win.
            event.stopPropagation()
            action.onSelect()
          }}
        >
          <action.icon className="h-4 w-4" />
          <span className="sr-only">{action.label}</span>
        </Button>
      ))}

      {menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 shrink-0 p-0"
              title={label}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} className="w-48">
            {ordinary.map((action) => (
              <DropdownMenuItem
                key={action.label}
                disabled={action.disabled}
                onClick={(event) => event.stopPropagation()}
                onSelect={() => action.onSelect()}
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}

            {ordinary.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}

            {destructive.map((action) => (
              <DropdownMenuItem
                key={action.label}
                disabled={action.disabled}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={(event) => event.stopPropagation()}
                onSelect={() => action.onSelect()}
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
