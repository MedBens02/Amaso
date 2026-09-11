import type { StylesConfig } from "react-select"

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
  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
  menuList: (base) => ({
    ...base,
    maxHeight: "260px",
    backgroundColor: "hsl(var(--popover))",
    padding: "4px",
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
 * Spread onto every <ReactSelect> so one import carries the theme, the portal
 * and the Arabic empty-state together.
 */
export const reactSelectProps = {
  styles: reactSelectStyles,
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed" as const,
  menuShouldBlockScroll: false,
  isRtl: true,
  noOptionsMessage: () => "لا توجد خيارات",
  loadingMessage: () => "جاري التحميل...",
}
