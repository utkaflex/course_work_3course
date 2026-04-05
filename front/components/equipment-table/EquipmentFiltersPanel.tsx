"use client"

import * as React from "react"
import {Table as TanTable} from "@tanstack/react-table"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion"
import {DataTableComboboxFilter} from "@/components/data-table-combobox-filter"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"

type Option = { value: string; label: string; color?: string }
type RoomOption = Option & { buildingValue: string }
type CategoryOption = { value: string; label: string; typeNames: string[] }

type FilterOptions = {
  types: Option[]
  statuses: Option[]
  buildings: Option[]
  responsible_users: Option[]
  offices: Option[]
  rooms: RoomOption[]
  categories: CategoryOption[]
}

export function useCategoryToTypesFilter<TData>(args: {
  table: TanTable<TData>
  categories: CategoryOption[]
  selectedCategories: string[]
}) {
  const {table, categories, selectedCategories} = args
  const previousSelectedCategoriesRef = React.useRef<string[]>(selectedCategories)

  React.useEffect(() => {
    const typeCol = table.getColumn("type_name")
    if (!typeCol) return

    const hadCategoriesBefore = previousSelectedCategoriesRef.current.length > 0
    const hasCategoriesNow = selectedCategories.length > 0

    if (!hasCategoriesNow) {
      if (hadCategoriesBefore) {
        typeCol.setFilterValue([])
      }

      previousSelectedCategoriesRef.current = selectedCategories
      return
    }

    if (!categories.length) return

    const unionTypeNames = Array.from(
      new Set(
        categories
          .filter((c) => selectedCategories.includes(c.value))
          .flatMap((c) => c.typeNames)
      )
    )

    typeCol.setFilterValue(unionTypeNames)
    previousSelectedCategoriesRef.current = selectedCategories
  }, [table, categories, selectedCategories])
}

export default function EquipmentFiltersPanel<TData>({
                                                       table,
                                                       actionsAllowed,
                                                       filterOptions,
                                                       selectedCategories,
                                                       setSelectedCategories,
                                                       maxWidthClassName = "max-w-[1525px]",
                                                     }: {
  table: TanTable<TData>
  actionsAllowed: boolean
  filterOptions: FilterOptions
  selectedCategories: string[]
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>
  maxWidthClassName?: string
}) {
  useCategoryToTypesFilter({
    table,
    categories: filterOptions.categories,
    selectedCategories,
  })

  const acceptedDateFilter =
    (table.getColumn("accepted_date")?.getFilterValue() as { from?: string; to?: string }) ?? {}

  const selectedBuildings =
    ((table.getColumn("building_adress")?.getFilterValue() as string[]) ?? []).filter(Boolean)
  const selectedRooms =
    ((table.getColumn("room")?.getFilterValue() as string[]) ?? []).filter(Boolean)

  const roomToBuilding = React.useMemo(
    () => new Map(filterOptions.rooms.map((room) => [room.value, room.buildingValue])),
    [filterOptions.rooms]
  )

  const selectedRoomBuildings = React.useMemo(
    () =>
      Array.from(
        new Set(
          selectedRooms
            .map((roomValue) => roomToBuilding.get(roomValue))
            .filter((buildingValue): buildingValue is string => Boolean(buildingValue))
        )
      ),
    [selectedRooms, roomToBuilding]
  )

  const availableRooms = React.useMemo(
    () =>
      selectedBuildings.length
        ? filterOptions.rooms.filter((room) => selectedBuildings.includes(room.buildingValue))
        : filterOptions.rooms,
    [filterOptions.rooms, selectedBuildings]
  )

  const availableBuildings = React.useMemo(
    () =>
      selectedRoomBuildings.length
        ? filterOptions.buildings.filter((building) => selectedRoomBuildings.includes(building.value))
        : filterOptions.buildings,
    [filterOptions.buildings, selectedRoomBuildings]
  )

  React.useEffect(() => {
    const roomCol = table.getColumn("room")
    const buildingCol = table.getColumn("building_adress")
    if (!roomCol || !buildingCol) return

    if (selectedBuildings.length) {
      const allowedRoomValues = new Set(availableRooms.map((room) => room.value))
      const nextSelectedRooms = selectedRooms.filter((roomValue) => allowedRoomValues.has(roomValue))

      if (nextSelectedRooms.length !== selectedRooms.length) {
        roomCol.setFilterValue(nextSelectedRooms)
        return
      }
    }

    if (selectedRoomBuildings.length) {
      const allowedBuildingValues = new Set(selectedRoomBuildings)
      const nextSelectedBuildings = selectedBuildings.filter((buildingValue) =>
        allowedBuildingValues.has(buildingValue)
      )

      if (nextSelectedBuildings.length !== selectedBuildings.length) {
        buildingCol.setFilterValue(nextSelectedBuildings)
      }
    }
  }, [
    table,
    availableRooms,
    selectedBuildings,
    selectedRooms,
    selectedRoomBuildings,
  ])

  const setAcceptedDateFilter = (patch: Partial<{ from?: string; to?: string }>) => {
    table.getColumn("accepted_date")?.setFilterValue({
      ...acceptedDateFilter,
      ...patch,
    })
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1" className="border-0 px-1">
        <div className="flex gap-4 items-center">
          <AccordionTrigger className="flex h-[40px] min-w-[100px] max-w-[100px] py-0">
            Фильтры
          </AccordionTrigger>

          <Button className="bg-blue-2 hover:bg-blue-700" onClick={() =>
          {table.resetColumnFilters(); setSelectedCategories([])}}>
            Очистить фильтры
          </Button>
        </div>

        <AccordionContent className={cn("flex flex-wrap gap-2 p-1", maxWidthClassName)}>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Тип оборудования</label>
            <DataTableComboboxFilter
              column={table.getColumn("type_name")}
              options={filterOptions.types}
              placeholder="Фильтр по типу оборудования..."
              searchPlaceholder="Поиск типа..."
              emptyText="Типы не найдены"
              multiple
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Категория</label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-[300px] justify-between border bg-white hover:bg-muted/30",
                    !selectedCategories.length && "text-muted-foreground"
                  )}
                >
                  {selectedCategories.length
                    ? selectedCategories.length <= 2
                      ? selectedCategories.join(", ")
                      : `${selectedCategories.slice(0, 2).join(", ")} +${
                        selectedCategories.length - 2
                      }`
                    : "Фильтр по категории..."}
                  <ChevronsUpDown className="opacity-50"/>
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0 w-[300px] bg-light-3 border shadow rounded-md" align="start">
                <Command className="bg-light-3">
                  <CommandInput placeholder="Поиск категории..." className="h-9"/>
                  <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                    <CommandEmpty className="py-3 text-center text-sm">Категории не найдены</CommandEmpty>

                    <CommandGroup
                      className="overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                      <CommandItem value="__clear__" onSelect={() => setSelectedCategories([])}>
                        Сбросить фильтр
                      </CommandItem>

                      {filterOptions.categories.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.value)
                        return (
                          <CommandItem
                            key={cat.value}
                            value={cat.label}
                            onSelect={() => {
                              setSelectedCategories((prev) =>
                                prev.includes(cat.value)
                                  ? prev.filter((v) => v !== cat.value)
                                  : [...prev, cat.value]
                              )
                            }}
                          >
                            {cat.label}
                            <Check className={cn("ml-auto", isSelected ? "opacity-100" : "opacity-0")}/>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Модель</label>
            <Input
              placeholder="Фильтр по модели оборудования..."
              value={(table.getColumn("model")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("model")?.setFilterValue(event.target.value)}
              className="w-[300px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Серийный номер</label>
            <Input
              placeholder="Фильтр по серийному номеру..."
              value={(table.getColumn("serial_number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("serial_number")?.setFilterValue(event.target.value)
              }
              className="w-[300px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Инвентарный номер</label>
            <Input
              placeholder="Фильтр по инвентарному номеру..."
              value={(table.getColumn("inventory_number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("inventory_number")?.setFilterValue(event.target.value)
              }
              className="w-[300px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Сетевое имя</label>
            <Input
              placeholder="Фильтр по сетевому имени..."
              value={(table.getColumn("network_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("network_name")?.setFilterValue(event.target.value)}
              className="w-[300px]"
            />
          </div>

          {actionsAllowed && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Ответственное лицо</label>
              <DataTableComboboxFilter
                column={table.getColumn("responsible_user_full_name")}
                options={filterOptions.responsible_users}
                placeholder="Фильтр по ответственному лицу..."
                searchPlaceholder="Поиск ответственного лица..."
                emptyText="Ответственное лицо не найдено"
                multiple
              />
            </div>
          )}

          {actionsAllowed && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Статус</label>
              <DataTableComboboxFilter
                column={table.getColumn("last_status_type")}
                options={filterOptions.statuses}
                placeholder="Фильтр по статусу..."
                searchPlaceholder="Поиск статуса..."
                emptyText="Статус не найден"
                multiple
              />
            </div>
          )}

          {actionsAllowed && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Адрес</label>
              <DataTableComboboxFilter
                column={table.getColumn("building_adress")}
                options={availableBuildings}
                placeholder="Фильтр по адресу..."
                searchPlaceholder="Поиск адреса..."
                emptyText="Адрес не найден"
                multiple
                maxLabelsToShow={1}
              />
            </div>
          )}

          {actionsAllowed && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Помещение</label>
              <DataTableComboboxFilter
                column={table.getColumn("room")}
                options={availableRooms}
                placeholder="Фильтр по помещению..."
                searchPlaceholder="Поиск помещения..."
                emptyText="Помещение не найдено"
                multiple
                maxLabelsToShow={1}
              />
            </div>
          )}

          {actionsAllowed && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Подразделение</label>
              <DataTableComboboxFilter
                column={table.getColumn("responsible_user_office")}
                options={filterOptions.offices}
                placeholder="Фильтр по подразделению..."
                searchPlaceholder="Поиск подразделения..."
                emptyText="Подразделение не найдено"
                multiple
                maxLabelsToShow={1}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Дата принятия к учёту</label>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                className="w-[145px]"
                value={acceptedDateFilter.from ?? ""}
                onChange={(e) => setAcceptedDateFilter({from: e.target.value || undefined})}
              />
              <span className="text-sm text-muted-foreground">—</span>
              <Input
                type="date"
                className="w-[145px]"
                value={acceptedDateFilter.to ?? ""}
                onChange={(e) => setAcceptedDateFilter({to: e.target.value || undefined})}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.getColumn("accepted_date")?.setFilterValue(undefined)}
              >
                Сброс
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
