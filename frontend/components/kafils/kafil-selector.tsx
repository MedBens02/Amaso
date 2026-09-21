"use client"

import { useState, useEffect } from "react"
import AsyncSelect from "react-select/async"
import { Badge } from "@/components/ui/badge"
import { reactSelectProps, reactSelectStyles } from "@/lib/react-select-theme"
import api from "@/lib/api"

interface Kafil {
  id: string | number
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
  excludeIds?: string[]  // List of kafil IDs to exclude from selection
}

export function KafilSelector({ value, onValueChange, placeholder = "اختر الكفيل", excludeIds = [] }: KafilSelectorProps) {
  const [defaultOptions, setDefaultOptions] = useState<KafilOption[]>([])

  useEffect(() => {
    // Load initial kafils data for default options
    const loadDefaultKafils = async () => {
      try {
        const response = await api.getKafilsForSponsorship()
        const options = response.data
          .filter((kafil: Kafil) => !excludeIds.includes(kafil.id.toString()))
          .map((kafil: Kafil) => ({
            value: kafil.id.toString(),
            label: kafil.name,
            kafil
          }))
        setDefaultOptions(options)
      } catch (error) {
        console.error('Error loading default kafils:', error)
      }
    }
    
    loadDefaultKafils()
  }, [excludeIds])

  const loadOptions = async (inputValue: string): Promise<KafilOption[]> => {
    try {
      // One letter is too little to ask the server for - it would match
      // most of the register - but returning nothing for it told the person
      // typing "لا توجد نتائج", which reads as "this search is broken"
      // rather than "keep typing". The list already on hand is filtered
      // instead, so the first keystroke narrows something.
      if (inputValue.length === 1) {
        const needle = inputValue.toLowerCase()

        return defaultOptions.filter((option) => option.label.toLowerCase().includes(needle))
      }

      const response = await api.getKafilsForSponsorship(inputValue || undefined)
      return response.data
        .filter((kafil: Kafil) => !excludeIds.includes(kafil.id.toString()))
        .map((kafil: Kafil) => ({
          value: kafil.id.toString(),
          label: kafil.name,
          kafil
        }))
    } catch (error) {
      console.error('Error loading kafils:', error)
      return []
    }
  }

  const selectedOption = defaultOptions.find(option => option.value === value)

  /**
   * The shared theme, with the one thing this control genuinely needs on
   * top: roomier options, because a kafil's line carries their pledge and
   * sponsorship count under the name.
   *
   * This used to be a full hand-written copy of the theme, which had
   * drifted: it set `position: relative` on the menu (breaking the portal's
   * own positioning and its max-height) and left `pointerEvents` off the
   * portal, so inside a dialog the list ignored the mouse entirely.
   */
  const customStyles = {
    ...reactSelectStyles,
    option: (base: any, state: any) => ({
      ...reactSelectStyles.option!(base, state),
      padding: '12px',
    }),
  }

  const formatOptionLabel = (option: KafilOption) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div>
          <div className="font-medium">{option.kafil.name}</div>
          <div className="text-sm text-muted-foreground">
            تعهد: DH{option.kafil.monthly_pledge} | مكفول: {option.kafil.sponsorships_count} أرملة
          </div>
        </div>
      </div>
      <div className="text-left">
        <Badge 
          variant={option.kafil.remaining_amount >= 0 ? "secondary" : "destructive"}
          className="text-xs"
        >
          متبقي: DH{option.kafil.remaining_amount}
        </Badge>
      </div>
    </div>
  )

  return (
    <div>
      {/* The generics are pinned: with only the styles object to infer from,
          TypeScript widens onChange's argument to "one option or many" and
          reading .value off it stops compiling. */}
      <AsyncSelect<KafilOption, false>
        {...reactSelectProps}
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
        isClearable={true}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        noOptionsMessage={({ inputValue }) => 
          inputValue ? `لا توجد نتائج لـ "${inputValue}"` : "لا توجد كفلاء متاحين"
        }
        loadingMessage={() => "جاري البحث..."}
      />
    </div>
  )
}