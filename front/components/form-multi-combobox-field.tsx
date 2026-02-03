"use client"

import * as React from "react"
import {FieldValues, Path, UseFormReturn} from "react-hook-form"
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "./ui/form"
import {Button} from "./ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "./ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "./ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"

function FormMultiComboboxField<
  TForm extends FieldValues,
  TComboboxData extends FieldValues
>({
    form,
    name,
    label,
    data,
    id_field,
    value_field,
    placeholder,
    searchPlaceholder,
    emptyText,
  }: {
  form: UseFormReturn<TForm>
  name: Path<TForm>
  label: string
  data: TComboboxData[]
  id_field: keyof TComboboxData & string
  value_field: keyof TComboboxData & string
  placeholder: string
  searchPlaceholder: string
  emptyText: string
}) {
  const options = React.useMemo(
    () =>
      data.map((d) => ({
        value: Number(d[id_field]),
        label: String(d[value_field]),
      })),
    [data, id_field, value_field]
  )

  return (
    <FormField
      control={form.control}
      name={name}
      render={({field}) => {
        const current: number[] = Array.isArray(field.value) ? field.value : []

        const toggle = (val: number) => {
          const next = current.includes(val)
            ? current.filter((v) => v !== val)
            : [...current, val]
          field.onChange(next)
        }

        const selectedOptions = options.filter((o) => current.includes(o.value))

        const buttonLabel =
          selectedOptions.length === 0
            ? placeholder
            : selectedOptions.length <= 2
              ? selectedOptions.map((o) => o.label).join(", ")
              : `${selectedOptions.slice(0, 2).map(o => o.label).join(", ")} +${selectedOptions.length - 2}`

        return (
          <FormItem className="flex flex-col gap-1">
            <FormLabel>{label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
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
                </FormControl>
              </PopoverTrigger>

              <PopoverContent className="p-0 w-full" align="start" onWheelCapture={(e) => e.stopPropagation()}>
                <Command>
                  <CommandInput placeholder={searchPlaceholder} className="h-9"/>
                  <CommandList>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="__clear__" onSelect={() => field.onChange([])}>
                        Сбросить выбор
                      </CommandItem>

                      {options.map((opt) => {
                        const isSelected = current.includes(opt.value)
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

            <FormMessage/>
          </FormItem>
        )
      }}
    />
  )
}

export default FormMultiComboboxField
