"use client"

import React from 'react'
import Select, { MultiValue, ActionMeta } from 'react-select'
import { reactSelectStyles } from '@/lib/react-select-theme'
import CreatableSelect from 'react-select/creatable'

export interface Option {
  label: string
  value: string
}

interface MultiSelectRSProps {
  options: Option[]
  value?: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  isCreatable?: boolean
  isRtl?: boolean
  className?: string
  isDisabled?: boolean
  isClearable?: boolean
  menuPortalTarget?: HTMLElement | null
}

export function MultiSelectRS({
  options,
  value = [],
  onChange,
  placeholder = "اختر العناصر",
  isCreatable = false,
  isRtl = true,
  className = "",
  isDisabled = false,
  isClearable = true,
  menuPortalTarget = typeof document !== 'undefined' ? document.body : null,
}: MultiSelectRSProps) {
  
  // Build selected options including both existing options and newly created ones
  const selectedOptions = value.map(val => {
    // First try to find in existing options
    const existingOption = options.find(opt => opt.value === val)
    if (existingOption) {
      return existingOption
    }
    // If not found, it might be a new option - create it
    return { label: val.startsWith('__new_option_') ? val.replace('__new_option_', '') : val, value: val }
  })
  
  const handleChange = (
    newValue: MultiValue<Option>,
    actionMeta: ActionMeta<Option>
  ) => {
    const values = newValue.map(option => option.value)
    onChange(values)
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
        isMulti
        options={options}
        value={selectedOptions}
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
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        blurInputOnSelect={false}
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
          const newOption = { label: inputValue, value: `__new_option_${inputValue}` }
          const newValue = [...selectedOptions, newOption]
          const values = newValue.map(opt => opt.value)
          onChange(values)
        }}
        components={{
          IndicatorSeparator: () => null,
        }}
        noOptionsMessage={() => "لا توجد خيارات"}
      />
    </div>
  )
}