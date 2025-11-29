"use client"

import * as React from "react"
import { Column } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = {
  value: string
  label: string
  color?: string
}

interface DataTableComboboxFilterProps<TData> {
  column?: Column<TData, unknown>
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  allowClear?: boolean
}

export function DataTableComboboxFilter<TData>({
                                                 column,
                                                 options,
                                                 placeholder = "Выберите значение...",
                                                 searchPlaceholder = "Поиск...",
                                                 emptyText = "Ничего не найдено",
                                                 className,
                                                 allowClear = true,
                                               }: DataTableComboboxFilterProps<TData>) {
  const filterValue = (column?.getFilterValue() as string) ?? ""

  const selected = options.find((o) => o.value === filterValue)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-[300px] justify-between",
            !selected && "text-muted-foreground",
            className
          )}
        >
          {selected ? (
            selected.color ? (
              <span style={{ color: selected.color }}>{selected.label}</span>
            ) : (
              selected.label
            )
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[300px]" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>

            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => column?.setFilterValue("")}
                >
                  Сбросить фильтр
                </CommandItem>
              )}

              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => column?.setFilterValue(opt.value)}
                >
                  {opt.color ? (
                    <span style={{ color: opt.color }}>{opt.label}</span>
                  ) : (
                    opt.label
                  )}

                  <Check
                    className={cn(
                      "ml-auto",
                      opt.value === filterValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
