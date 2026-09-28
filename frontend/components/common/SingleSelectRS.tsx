"use client"

import React from 'react'
import Select, { ActionMeta } from 'react-select'
import { reactSelectProps } from '@/lib/react-select-theme'
import CreatableSelect from 'react-select/creatable'

export interface Option {
  label: string
  value: string
}

/** A heading with its own options under it, e.g. a sector and its neighborhoods. */
export interface OptionGroup {
  label: string
  options: Option[]
}

const isGroup = (item: Option | OptionGroup): item is OptionGroup =>
  Array.isArray((item as OptionGroup).options)

/** Every option, whether the list is grouped or flat. */
const flatten = (items: Array<Option | OptionGroup>): Option[] =>
  items.flatMap((item) => (isGroup(item) ? item.options : [item]))

interface SingleSelectRSProps {
  options: Array<Option | OptionGroup>
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
    const existingOption = flatten(options).find(opt => opt.value === value)
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

  const SelectComponent = isCreatable ? CreatableSelect : Select

  return (
    <div className={className}>
      <SelectComponent
        {...reactSelectProps}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isRtl={isRtl}
        isDisabled={isDisabled}
        isClearable={isClearable}
        menuPortalTarget={menuPortalTarget}
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
      />
    </div>
  )
}