"use client"

import * as React from "react"
import { components as reactSelectComponents, type MenuListProps, type StylesConfig } from "react-select"

/**
 * react-select, dressed in the app's own theme.
 *
 * react-select ships its own inline styles - a white control, near-black
 * text, a white menu - and knows nothing about a CSS-variable theme. Every
 * place that rendered one without a full style object was therefore a white
 * box sitting in a dark dialog: the income form (which set a border and
 * nothing else), the kafil statement, the expense form. Two components had
 * each grown their own correct copy of these styles, which is how the third
 * and fourth places ended up without any.
 *
 * Values are read from the same custom properties as the rest of the app, so
 * the control follows the theme toggle with no JavaScript of its own.
 */
export const reactSelectStyles: StylesConfig<any, any, any> = {
  control: (base, state) => ({
    ...base,
    minHeight: "40px",
    backgroundColor: "hsl(var(--background))",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    borderRadius: "calc(var(--radius) - 2px)",
    boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring) / 0.35)" : "none",
    "&:hover": { borderColor: "hsl(var(--border))" },
  }),
  valueContainer: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
  input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
  singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
  placeholder: (base) => ({ ...base, color: "hsl(var(--muted-foreground))" }),
  multiValue: (base) => ({ ...base, backgroundColor: "hsl(var(--secondary))" }),
  multiValueLabel: (base) => ({ ...base, color: "hsl(var(--secondary-foreground))" }),
  multiValueRemove: (base) => ({
    ...base,
    color: "hsl(var(--secondary-foreground))",
    ":hover": { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    color: "hsl(var(--popover-foreground))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "calc(var(--radius) - 2px)",
    // Above the dialog overlay, which sits at z-50.
    zIndex: 99999,
    overflow: "hidden",
  }),
  // The menu is portalled to <body>, so it cannot be clipped by a dialog that
  // scrolls its own content - which is what made long lists (income sources,
  // skills, sponsors) look like they simply stopped partway down.
  // pointerEvents matters as much as the z-index here. A Radix dialog puts
  // `pointer-events: none` on <body> while it is open, so that only what is
  // inside the dialog can be clicked. This menu is portalled to <body> - it
  // is outside that subtree - so it inherited the block: the list rendered
  // on top of everything and then quietly refused the mouse, passing clicks
  // through to whatever sat behind it. Keyboard selection still worked,
  // because focus never left the control inside the dialog, which is what
  // made it look like a scrolling bug rather than a dead menu.
  menuPortal: (base) => ({ ...base, zIndex: 99999, pointerEvents: "auto" }),
  menuList: (base) => ({
    ...base,
    // No maxHeight of our own. react-select works one out for every open -
    // `maxMenuHeight` where the menu fits, less where it does not - and a
    // fixed 260px here overrode it, so a control near the bottom of the
    // window opened a list 260px tall into 150px of space and the rest of
    // it was simply off the screen. There is no scrolling out of that:
    // the menu is `position: fixed`, so nothing scrolls it into view.
    backgroundColor: "hsl(var(--popover))",
    padding: "4px",
    // Reaching the end of the list should not start scrolling whatever is
    // behind it.
    overscrollBehavior: "contain",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
        ? "hsl(var(--accent))"
        : "transparent",
    color: state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
    borderRadius: "calc(var(--radius) - 4px)",
    cursor: "pointer",
    ":active": { backgroundColor: "hsl(var(--accent))" },
  }),
  noOptionsMessage: (base) => ({ ...base, color: "hsl(var(--muted-foreground))" }),
  loadingMessage: (base) => ({ ...base, color: "hsl(var(--muted-foreground))" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    ":hover": { color: "hsl(var(--foreground))" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    ":hover": { color: "hsl(var(--foreground))" },
  }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "hsl(var(--border))" }),
  groupHeading: (base) => ({ ...base, color: "hsl(var(--muted-foreground))" }),
}

/**
 * The option list, with the wheel put back.
 *
 * A Radix dialog locks scrolling while it is open, and it does it by
 * listening for `wheel` on the document and calling preventDefault on
 * anything that did not come from inside the dialog. Our menu is portalled
 * to <body> precisely so the dialog cannot clip it - which also puts it
 * outside the dialog, so every wheel tick over the list was cancelled. The
 * arrow keys worked (they are not wheel events) and so did dragging the
 * scrollbar (also not a wheel event), which is exactly how it was reported:
 * a list you can see, can scroll by hand, and cannot scroll with the mouse.
 *
 * Stopping the event at the list keeps it from reaching the document
 * listener at all, so the browser scrolls the list the way it normally
 * would. `overscrollBehavior: contain` above stops the page moving once the
 * list has nowhere left to go.
 */
function MenuList(props: MenuListProps<any, boolean, any>) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const { innerRef } = props

  const captureRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element)
      if (typeof innerRef === "function") innerRef(element)
      else if (innerRef) (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = element
    },
    [innerRef],
  )

  React.useEffect(() => {
    if (!node) return
    const keepItHere = (event: WheelEvent) => event.stopPropagation()
    node.addEventListener("wheel", keepItHere)
    return () => node.removeEventListener("wheel", keepItHere)
  }, [node])

  return <reactSelectComponents.MenuList {...props} innerRef={captureRef} />
}

/**
 * Everything a <ReactSelect> in this app needs that is not about the data it
 * shows: the theme, the portal, the placement and the Arabic empty states.
 *
 * Spread it, do not copy it. Five wrappers each carrying their own copy of
 * these six props is what let the clipped menu and the dead wheel live in
 * some of them and not others.
 */
export const reactSelectComponentOverrides = {
  IndicatorSeparator: () => null,
  MenuList,
}

export const reactSelectProps = {
  styles: reactSelectStyles,
  components: reactSelectComponentOverrides,
  classNamePrefix: "rs",
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed" as const,
  // Open upwards when there is not enough room below. Without this the menu
  // always opens downwards and a control low on the screen loses its last
  // options off the bottom edge.
  menuPlacement: "auto" as const,
  maxMenuHeight: 280,
  // Below this much room, open upwards rather than squeezing the list into
  // what is left: react-select only flips once the space below is too small
  // even for the minimum, and its own 140px minimum is two or three options.
  minMenuHeight: 220,
  menuShouldBlockScroll: false,
  menuShouldScrollIntoView: false,
  isRtl: true,
  noOptionsMessage: () => "لا توجد خيارات",
  loadingMessage: () => "جاري التحميل...",
}
