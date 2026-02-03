"use client"

import * as React from "react"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"

type Option = { value: number; label: string }

export function TypeMultiSelect({
                                  options,
                                  value,
                                  onChange,
                                  placeholder = "Выберите типы оборудования...",
                                }: {
  options: Option[]
  value: number[]
  onChange: (next: number[]) => void
  placeholder?: string
}) {
  const toggle = (val: number) => {
    const next = value.includes(val)
      ? value.filter(v => v !== val)
      : [...value, val]
    onChange(next)
  }

  const selectedOptions = options.filter(o => value.includes(o.value))
  const buttonLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= 2
        ? selectedOptions.map(o => o.label).join(", ")
        : `${selectedOptions.slice(0, 2).map(o => o.label).join(", ")} +${selectedOptions.length - 2}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            selectedOptions.length === 0 && "text-muted-foreground"
          )}
        >
          {buttonLabel}
          <ChevronsUpDown className="opacity-50"/>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-full" align="start">
        <Command>
          <CommandInput placeholder="Поиск типа..." className="h-9"/>
          <CommandList>
            <CommandEmpty>Типы не найдены</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__clear__"
                onSelect={() => onChange([])}
              >
                Сбросить выбор
              </CommandItem>

              {options.map(opt => {
                const isSelected = value.includes(opt.value)
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => toggle(opt.value)}
                  >
                    {opt.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
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
