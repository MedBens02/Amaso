"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  onValueChange: (value: string[]) => void
  defaultValue?: string[]
  value?: string[]
  placeholder?: string
  variant?: "default" | "inverted"
  animation?: number
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
  enableSearch?: boolean
}

export function MultiSelect({
  options,
  onValueChange,
  defaultValue = [],
  value,
  placeholder = "Select items",
  variant = "default",
  animation = 0,
  maxCount = 3,
  modalPopover = false,
  asChild = false,
  className,
  enableSearch = true,
  ...props
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value || defaultValue)
  
  // Update internal state when controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value)
    }
  }, [value])
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      setIsPopoverOpen(true)
    } else if (event.key === "Backspace" && !event.currentTarget.value) {
      const newSelectedValues = [...selectedValues]
      newSelectedValues.pop()
      setSelectedValues(newSelectedValues)
      onValueChange(newSelectedValues)
    }
  }

  const toggleOption = (option: string) => {
    console.log('toggleOption called with:', option, 'current values:', selectedValues)
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option]
    console.log('new values:', newSelectedValues)
    setSelectedValues(newSelectedValues)
    onValueChange(newSelectedValues)
  }

  const handleClear = () => {
    setSelectedValues([])
    onValueChange([])
  }

  const handleTogglePopover = (e: React.MouseEvent) => {
    // Only prevent form submission, not the normal popover behavior
    e.preventDefault()
    console.log('MultiSelect button clicked', { isPopoverOpen })
    setIsPopoverOpen((prev) => !prev)
  }

  const clearExtraOptions = () => {
    const newSelectedValues = selectedValues.slice(0, maxCount)
    setSelectedValues(newSelectedValues)
    onValueChange(newSelectedValues)
  }

  const toggleAll = () => {
    console.log('toggleAll called, current length:', selectedValues.length, 'options length:', options.length)
    if (selectedValues.length === options.length) {
      handleClear()
    } else {
      const allValues = options.map((option) => option.value)
      console.log('selecting all values:', allValues)
      setSelectedValues(allValues)
      onValueChange(allValues)
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          ref={React.useRef<HTMLButtonElement>(null)}
          {...props}
          onClick={handleTogglePopover}
          className={cn(
            "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit",
            {
              "px-3 py-2": variant === "default",
              "px-3 py-2 bg-background": variant === "inverted",
            },
            className,
          )}
          variant="outline"
        >
          {selectedValues.length > 0 ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-wrap items-center">
                {selectedValues.slice(0, maxCount).map((value) => {
                  const option = options.find((o) => o.value === value)
                  const IconComponent = React.createElement("span")
                  return (
                    <Badge
                      key={value}
                      className={cn(
                        "m-1 text-xs",
                        variant === "inverted" && "bg-background text-foreground hover:bg-background",
                      )}
                      style={{ animationDuration: `${animation}s` }}
                    >
                      {IconComponent}
                      {option?.label}
                      <X
                        className="ml-2 h-3 w-3 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleOption(value)
                        }}
                      />
                    </Badge>
                  )
                })}
                {selectedValues.length > maxCount && (
                  <Badge
                    className={cn(
                      "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
                      variant === "inverted" && "bg-background text-foreground hover:bg-background",
                    )}
                  >
                    {`+ ${selectedValues.length - maxCount} more`}
                    <X
                      className="ml-2 h-3 w-3 cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation()
                        clearExtraOptions()
                      }}
                    />
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <X
                  className="h-4 mx-2 cursor-pointer text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleClear()
                  }}
                />
                <ChevronsUpDown className="h-4 cursor-pointer text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full mx-auto">
              <span className="text-sm text-muted-foreground mx-3">{placeholder}</span>
              <ChevronsUpDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[1000] pointer-events-auto" 
        align="start" 
        side="bottom" 
        avoidCollisions={true} 
        onEscapeKeyDown={() => setIsPopoverOpen(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          {enableSearch && (
            <CommandInput 
              placeholder="Search..." 
              onKeyDown={handleInputKeyDown}
              autoComplete="off"
              onKeyDownCapture={(e) => { 
                if (e.key === 'Enter') e.preventDefault(); 
              }}
              onMouseDown={(e) => e.preventDefault()}
            />
          )}
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem 
                key="all" 
                className="cursor-pointer"
                onSelect={() => {}} // Disable default selection
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleAll()
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedValues.length === options.length
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>(Select All)</span>
              </CommandItem>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    className="cursor-pointer"
                    onSelect={() => {}} // Disable default selection
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleOption(option.value)
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
