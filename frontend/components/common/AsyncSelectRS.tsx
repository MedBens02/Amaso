"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import AsyncSelect from "react-select/async"
import { reactSelectStyles } from "@/lib/react-select-theme"

export interface AsyncOption<T = any> {
  label: string
  value: string
  data?: T
}

interface AsyncSelectRSProps<T = any> {
  /** Called with the current query - "" on first open, so there is
   *  something to browse before anyone types a letter. */
  loadOptions: (query: string) => Promise<AsyncOption<T>[]>
  value?: string
  onChange: (value: string | null, option?: AsyncOption<T> | null) => void
  placeholder?: string
  isDisabled?: boolean
  isClearable?: boolean
  formatOptionLabel?: (option: AsyncOption<T>) => ReactNode
  className?: string
  /** Re-fetches the default list, e.g. when an exclusion list changes. */
  refreshKey?: string | number
}

/**
 * A picker for a list too large to hand the browser in one piece and search
 * client-side - widows, orphans, donors - anything that can run past a
 * couple hundred rows in real use, where a plain Select is a scroll of names
 * nobody can read fast enough to find one.
 *
 * The list is fetched from the server as the person types, debounced by
 * hand: react-select's own AsyncSelect calls `loadOptions` on every
 * keystroke with nothing to slow it down, which is a request per letter
 * against a table of a few hundred names. The first page (an empty query) is
 * also fetched up front, so opening the field shows the same list a plain
 * Select would have rather than nothing until a letter is typed.
 */
export function AsyncSelectRS<T = any>({
  loadOptions,
  value,
  onChange,
  placeholder = "ابحث...",
  isDisabled = false,
  isClearable = true,
  formatOptionLabel,
  className,
  refreshKey,
}: AsyncSelectRSProps<T>) {
  const [defaultOptions, setDefaultOptions] = useState<AsyncOption<T>[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    loadOptions("").then((options) => {
      if (!cancelled) setDefaultOptions(options)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  const debouncedLoad = (input: string): Promise<AsyncOption<T>[]> =>
    new Promise((resolve) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        loadOptions(input).then(resolve).catch(() => resolve([]))
      }, 300)
    })

  // The value the form holds is only ever an id: resolve it against the
  // options already on hand so a freshly-picked one shows immediately
  // without waiting on a round trip that would just return it again.
  const selectedOption = value ? defaultOptions.find((option) => option.value === value) ?? null : null

  return (
    <div className={className}>
      <AsyncSelect<AsyncOption<T>, false>
        cacheOptions
        defaultOptions={defaultOptions}
        loadOptions={debouncedLoad}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : null, option ?? null)}
        placeholder={placeholder}
        isRtl
        isDisabled={isDisabled}
        isClearable={isClearable}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        menuShouldScrollIntoView={false}
        styles={reactSelectStyles}
        classNamePrefix="rs"
        formatOptionLabel={formatOptionLabel}
        noOptionsMessage={({ inputValue }) => (inputValue ? `لا توجد نتائج لـ "${inputValue}"` : "لا توجد خيارات")}
        loadingMessage={() => "جاري البحث..."}
        components={{ IndicatorSeparator: () => null }}
      />
    </div>
  )
}
