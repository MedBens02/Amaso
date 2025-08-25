"use client"

import React from 'react'
import Select, { MultiValue, ActionMeta } from 'react-select'
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
  
  console.log('MultiSelectRS render:', { 
    options, 
    value, 
    selectedOptions, 
    isCreatable 
  })

  const handleChange = (
    newValue: MultiValue<Option>,
    actionMeta: ActionMeta<Option>
  ) => {
    console.log('MultiSelectRS change:', { newValue, actionMeta })
    const values = newValue.map(option => option.value)
    console.log('Extracted values:', values)
    onChange(values)
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
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: 'hsl(var(--secondary))',
      borderRadius: '4px',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      fontSize: '14px',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
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
          console.log('Input key down:', event.key)
          if (event.key === 'Enter') {
            event.stopPropagation()
          }
        }}
        // Debug creatable behavior
        onCreateOption={(inputValue) => {
          console.log('onCreateOption called with:', inputValue)
          const newOption = { label: inputValue, value: `__new_option_${inputValue}` }
          const newValue = [...selectedOptions, newOption]
          console.log('Creating new option:', newOption, 'Full value:', newValue)
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