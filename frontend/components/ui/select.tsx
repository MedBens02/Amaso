"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * What the Root currently holds, so the list can keep the chosen option on
 * screen while a search hides everything else.
 *
 * Radix draws the trigger's text from the selected item while that item is
 * mounted. Filter it out of the list and the trigger goes blank - you type
 * three letters and the field appears to forget what was in it.
 */
const SelectValueContext = React.createContext<string | undefined>(undefined)

/**
 * The Root, plus knowledge of its own value.
 *
 * Both halves are covered: a controlled Select passes `value` and this
 * follows it, an uncontrolled one passes `defaultValue` and this tracks the
 * changes itself.
 */
const Select = ({
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) => {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const current = value !== undefined ? value : uncontrolled

  return (
    <SelectValueContext.Provider value={current}>
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => {
          setUncontrolled(next)
          onValueChange?.(next)
        }}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectValueContext.Provider>
  )
}
Select.displayName = "Select"

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

/**
 * Arabic written two ways is still the same word.
 *
 * Nobody types the hamza on أحمد consistently, "إبراهيم" and "ابراهيم" are
 * the same man, and a name ending in ة is as often written ه. Comparing the
 * raw strings means the search fails on exactly the entries people are
 * least sure how to spell, so both sides are flattened first.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/\s+/g, " ")
    .trim()
}

/** The words inside an option, however deeply they are wrapped in markup. */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join(" ")

  if (React.isValidElement(node)) {
    const props = node.props as { textValue?: string; children?: React.ReactNode }
    // Radix's own escape hatch for an option that is not plain text.
    if (typeof props.textValue === "string") return props.textValue

    return textOf(props.children)
  }

  return ""
}

interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  /**
   * Show a filter box above the list. Worth it wherever the options come
   * out of the database - categories, partners, budgets, sponsors, schools -
   * and not for the fixed handful like a payment method.
   */
  searchable?: boolean
  searchPlaceholder?: string
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>((
  {
    className,
    children,
    position = "popper",
    searchable,
    searchPlaceholder = "ابحث...",
    onKeyDown,
    onCloseAutoFocus,
    ...props
  },
  ref,
) => {
  const [query, setQuery] = React.useState("")
  const selected = React.useContext(SelectValueContext)

  /**
   * Typing filters the list instead of jumping through it.
   *
   * The obvious build - a text box above the options - cannot work here.
   * Radix keeps focus on the option list for as long as it is open and puts
   * it back whenever it leaves, so nothing typed ever reaches the box; and
   * inside a dialog it is worse still, because the dialog's own focus trap
   * pulls focus back to the trigger and the list never holds it at all.
   * What Radix spends those keys on is its own type-ahead, which jumps to
   * the first option starting with what was typed and gives up at the
   * second word.
   *
   * So the keys are taken from the document while the list is open, which
   * is the one place that sees them wherever focus happens to be. It has to
   * be the capture phase: the focused option's own handler treats a space
   * as "pick this one", and would otherwise close the list halfway through
   * a two-word search. Only letters and Backspace are taken - the arrows,
   * Enter and Escape are left alone - and the listener lives exactly as
   * long as the open list does.
   */
  React.useEffect(() => {
    if (!searchable) return

    const onKey = (event: KeyboardEvent) => {
      const consume = () => {
        event.preventDefault()
        event.stopPropagation()
      }

      if (event.key === "Backspace") {
        setQuery((current) => current.slice(0, -1))
        consume()

        return
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        setQuery((current) => current + event.key)
        consume()
      }
    }

    document.addEventListener("keydown", onKey, true)

    return () => document.removeEventListener("keydown", onKey, true)
  }, [searchable])

  const visible = React.useMemo(() => {
    if (!searchable || query.trim() === "") return children

    const needle = normalise(query)

    const keep = (node: React.ReactNode): boolean => {
      if (!React.isValidElement(node)) return true

      const props = node.props as { value?: string }
      // Anything that is not an option - a group label, a separator - is
      // left alone, and so is whatever is currently chosen, or the trigger
      // would lose the text it is showing.
      if (typeof props.value !== "string") return true
      if (props.value === selected) return true

      return normalise(textOf(node)).includes(needle)
    }

    const kept = React.Children.toArray(children).filter(keep)

    return kept.length > 0 ? kept : null
  }, [children, query, searchable, selected])

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 flex max-h-96 min-w-[8rem] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
        // Reset between openings: a filter still applied the next time the
        // list is opened looks like options that have gone missing.
        onCloseAutoFocus={(event) => {
          setQuery("")
          onCloseAutoFocus?.(event)
        }}
        onKeyDown={onKeyDown}
      >
        {searchable && (
          <div className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span
              className={cn("truncate text-sm", query ? "text-foreground" : "text-muted-foreground")}
              aria-live="polite"
            >
              {query || searchPlaceholder}
            </span>
          </div>
        )}

        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {visible ?? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
          )}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
