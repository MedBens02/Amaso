"use client"

import { useState, useEffect } from "react"
import AsyncSelect from "react-select/async"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

interface Kafil {
  id: string
  name: string
  monthly_pledge: number
  total_sponsored: number
  remaining_amount: number
  sponsorships_count: number
}

interface KafilOption {
  value: string
  label: string
  kafil: Kafil
}

interface KafilSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function KafilSelector({ value, onValueChange, placeholder = "اختر الكفيل" }: KafilSelectorProps) {
  const [defaultOptions, setDefaultOptions] = useState<KafilOption[]>([])

  useEffect(() => {
    // Load initial kafils data for default options
    const loadDefaultKafils = async () => {
      try {
        const response = await api.getKafilsForSponsorship()
        const options = response.data.map((kafil: Kafil) => ({
          value: kafil.id,
          label: kafil.name,
          kafil
        }))
        setDefaultOptions(options)
      } catch (error) {
        console.error('Error loading default kafils:', error)
      }
    }
    
    loadDefaultKafils()
  }, [])

  const loadOptions = async (inputValue: string): Promise<KafilOption[]> => {
    try {
      if (inputValue.length < 2 && inputValue.length > 0) {
        return []
      }
      
      const response = await api.getKafilsForSponsorship(inputValue || undefined)
      return response.data.map((kafil: Kafil) => ({
        value: kafil.id,
        label: kafil.name,
        kafil
      }))
    } catch (error) {
      console.error('Error loading kafils:', error)
      return []
    }
  }

  const selectedOption = defaultOptions.find(option => option.value === value)

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
      padding: '12px',
      '&:hover': {
        backgroundColor: 'hsl(var(--accent))',
        color: 'hsl(var(--accent-foreground))',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
  }

  const formatOptionLabel = (option: KafilOption) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div>
          <div className="font-medium">{option.kafil.name}</div>
          <div className="text-sm text-muted-foreground">
            تعهد: ₪{option.kafil.monthly_pledge} | مكفول: {option.kafil.sponsorships_count} أرملة
          </div>
        </div>
      </div>
      <div className="text-left">
        <Badge 
          variant={option.kafil.remaining_amount >= 0 ? "secondary" : "destructive"}
          className="text-xs"
        >
          متبقي: ₪{option.kafil.remaining_amount}
        </Badge>
      </div>
    </div>
  )

  return (
    <div>
      <AsyncSelect
        cacheOptions
        defaultOptions={defaultOptions}
        loadOptions={loadOptions}
        value={selectedOption}
        onChange={(option) => {
          if (option) {
            onValueChange(option.value)
          }
        }}
        placeholder={placeholder}
        isRtl={true}
        isClearable={true}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        menuShouldScrollIntoView={false}
        styles={customStyles}
        classNamePrefix="rs"
        formatOptionLabel={formatOptionLabel}
        noOptionsMessage={({ inputValue }) => 
          inputValue ? `لا توجد نتائج لـ "${inputValue}"` : "لا توجد كفلاء متاحين"
        }
        loadingMessage={() => "جاري البحث..."}
        components={{
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  )
}