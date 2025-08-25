"use client"

import React from 'react'
import Select, { ActionMeta } from 'react-select'
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
    console.log('SingleSelectRS change:', { newValue, actionMeta })
    onChange(newValue ? newValue.value : null)
  }

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '40px',
      border: '1px solid hsl(var(--border))',
      borderRadius: '6px',
      backgroundColor: 'hsl(var(--background))',
      '&:hover': {
        borderColor: 'hsl(var(--border))',
      },
      boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--ring))' : 'none',
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 99999,
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '6px',
      position: 'relative',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 99999,
      position: 'fixed',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'hsl(var(--primary))' 
        : state.isFocused 
        ? 'hsl(var(--accent))'
        : 'transparent',
      color: state.isSelected 
        ? 'hsl(var(--primary-foreground))' 
        : 'hsl(var(--foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--accent))',
        color: 'hsl(var(--accent-foreground))',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
  }

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
          console.log('Input key down:', event.key)
          if (event.key === 'Enter') {
            event.stopPropagation()
          }
        }}
        // Debug creatable behavior
        onCreateOption={(inputValue) => {
          console.log('onCreateOption called with:', inputValue)
          const newValue = `__new_option_${inputValue}`
          console.log('Creating new option with value:', newValue)
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