"use client"

import React from 'react'
import Select, { ActionMeta } from 'react-select'
import { reactSelectStyles } from '@/lib/react-select-theme'
import CreatableSelect from 'react-select/creatable'

export interface Option {
  label: string
  value: string
}

interface SingleSelectRSProps {
  options: Option[]
  value?: string
  onChange: (value: string | null) => void
  placeholder?: string
  isCreatable?: boolean
  isRtl?: boolean
  className?: string
  isDisabled?: boolean
  isClearable?: boolean
  menuPortalTarget?: HTMLElement | null
}

export function SingleSelectRS({
  options,
  value,
  onChange,
  placeholder = "اختر خياراً",
  isCreatable = false,
  isRtl = true,
  className = "",
  isDisabled = false,
  isClearable = true,
  menuPortalTarget = typeof document !== 'undefined' ? document.body : null,
}: SingleSelectRSProps) {
  
  // Build selected option including both existing options and newly created ones
  const selectedOption = value ? (() => {
    // First try to find in existing options
    const existingOption = options.find(opt => opt.value === value)
    if (existingOption) {
      return existingOption
    }
    // If not found, it might be a new option - create it
    return { label: value.startsWith('__new_option_') ? value.replace('__new_option_', '') : value, value: value }
  })() : null

  const handleChange = (
    newValue: Option | null,
    actionMeta: ActionMeta<Option>
  ) => {
    onChange(newValue ? newValue.value : null)
  }

  /**
   * The shared theme, plus the few rules this control needs on top.
   *
   * The local copy that used to live here set `position: 'relative'` on the
   * menu. react-select portals the menu to <body> and positions it absolutely
   * against the control; forcing it relative broke that, and with it the
   * list's own max-height - which is why long lists (income sources, skills,
   * sponsors) appeared to stop partway down with no way to scroll. The shared
   * theme leaves the positioning to the library and caps the list instead.
   */
  const customStyles = { ...reactSelectStyles }

  const SelectComponent = isCreatable ? CreatableSelect : Select

  return (
    <div className={className}>
      <SelectComponent
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isRtl={isRtl}
        isDisabled={isDisabled}
        isClearable={isClearable}
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        menuShouldScrollIntoView={false}
        styles={customStyles}
        classNamePrefix="rs"
        // Creatable specific props
        createOptionPosition="first"
        formatCreateLabel={(inputValue) => `إنشاء "${inputValue}"`}
        // Prevent form submission when Enter is pressed but allow react-select to handle creation
        onInputKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.stopPropagation()
          }
        }}
        onCreateOption={(inputValue) => {
          const newValue = `__new_option_${inputValue}`
          onChange(newValue)
        }}
        components={{
          IndicatorSeparator: () => null,
        }}
        noOptionsMessage={() => "لا توجد خيارات"}
      />
    </div>
  )
}