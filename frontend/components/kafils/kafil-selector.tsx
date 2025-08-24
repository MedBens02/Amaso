"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

interface KafilSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function KafilSelector({ value, onValueChange, placeholder = "اختر الكفيل" }: KafilSelectorProps) {
  const [open, setOpen] = useState(false)
  const [kafils, setKafils] = useState<Kafil[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const selectedKafil = kafils.find((kafil) => kafil.id === value)

  const fetchKafils = async (search?: string) => {
    try {
      setLoading(true)
      const response = await api.getKafilsForSponsorship(search)
      setKafils(response.data)
    } catch (error) {
      console.error('Error fetching kafils:', error)
      setKafils([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchKafils()
    }
  }, [open])

  const handleSearch = (search: string) => {
    setSearchTerm(search)
    if (search.length >= 2 || search.length === 0) {
      fetchKafils(search || undefined)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedKafil ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="truncate">{selectedKafil.name}</span>
              <Badge 
                variant={selectedKafil.remaining_amount >= 0 ? "secondary" : "destructive"}
                className="text-xs"
              >
                متبقي: ₪{selectedKafil.remaining_amount}
              </Badge>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[9999]" align="start" side="bottom" avoidCollisions={true}>
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="البحث عن كفيل..."
              value={searchTerm}
              onValueChange={handleSearch}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            {loading && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">جاري البحث...</p>
              </div>
            )}
            <CommandEmpty>لا توجد نتائج للبحث.</CommandEmpty>
            <CommandGroup>
              {kafils.map((kafil) => (
                <CommandItem
                  key={kafil.id}
                  value={kafil.name}
                  onSelect={() => {
                    onValueChange(kafil.id)
                    setOpen(false)
                  }}
                  className="p-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === kafil.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="font-medium">{kafil.name}</div>
                        <div className="text-sm text-muted-foreground">
                          تعهد: ₪{kafil.monthly_pledge} | مكفول: {kafil.sponsorships_count} أرملة
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge 
                        variant={kafil.remaining_amount >= 0 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        متبقي: ₪{kafil.remaining_amount}
                      </Badge>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}