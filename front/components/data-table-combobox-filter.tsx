"use client"

import * as React from "react"
import {Column} from "@tanstack/react-table"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"

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
  multiple?: boolean
  displayMode?: "count" | "labels"
  maxLabelsToShow?: number
}

export function DataTableComboboxFilter<TData>({
                                                 column,
                                                 options,
                                                 placeholder = "Выберите значение...",
                                                 searchPlaceholder = "Поиск...",
                                                 emptyText = "Ничего не найдено",
                                                 className,
                                                 allowClear = true,
                                                 multiple = false,
                                                 displayMode = "labels",
                                                 maxLabelsToShow = 2,
                                               }: DataTableComboboxFilterProps<TData>) {
  const raw = column?.getFilterValue()

  const filterValue = React.useMemo(() => {
    if (multiple) return (Array.isArray(raw) ? raw : []) as string[]
    return (typeof raw === "string" ? raw : "") as string
  }, [raw, multiple])

  const selectedOptions = React.useMemo(() => {
    if (multiple) {
      const arr = filterValue as string[]
      return options.filter(o => arr.includes(o.value))
    } else {
      const val = filterValue as string
      return val ? options.filter(o => o.value === val) : []
    }
  }, [filterValue, multiple, options])

  const setSingle = (val: string) => {
    column?.setFilterValue(val)
  }

  const toggleMulti = (val: string) => {
    const arr = filterValue as string[]
    const next = arr.includes(val)
      ? arr.filter(v => v !== val)
      : [...arr, val]
    column?.setFilterValue(next)
  }

  const clear = () => {
    column?.setFilterValue(multiple ? [] : "")
  }

  const buttonLabel = (() => {
    if (!selectedOptions.length) return placeholder

    if (!multiple) {
      const s = selectedOptions[0]
      return s.color ? (
        <span style={{color: s.color}}>{s.label}</span>
      ) : (
        s.label
      )
    }

    if (displayMode === "labels") {
      const labels = selectedOptions.map(o => o.label)
      if (labels.length > maxLabelsToShow) {
        return `${labels.slice(0, maxLabelsToShow).join(", ")} +${
          labels.length - maxLabelsToShow
        }`
      }
      return labels.join(", ")
    }

    return `Выбрано: ${selectedOptions.length}`
  })()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-[300px] justify-between overflow-hidden",
            !selectedOptions.length && "text-muted-foreground",
            className
          )}
        >
          {buttonLabel}
          <ChevronsUpDown className="opacity-50"/>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[300px]" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9"/>
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>

            <CommandGroup>
              {allowClear && (
                <CommandItem value="__clear__" onSelect={clear}>
                  Сбросить фильтр
                </CommandItem>
              )}

              {options.map((opt) => {
                const isSelected = multiple
                  ? (filterValue as string[]).includes(opt.value)
                  : (filterValue as string) === opt.value

                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() =>
                      multiple ? toggleMulti(opt.value) : setSingle(opt.value)
                    }
                  >
                    {opt.color ? (
                      <span style={{color: opt.color}}>{opt.label}</span>
                    ) : (
                      opt.label
                    )}

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
