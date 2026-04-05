"use client"

import * as React from "react"
import {useEffect} from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import {Button} from "@/components/ui/button"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {CorrectPagesCase} from "../helper-functions"
import EquipmentAddForm from "./equipment-add-form"
import {API_URL} from "@/constants"
import Action from "../action"
import axios from "axios";
import ReportDownloadButton from "@/components/report-download-button";
import EquipmentFiltersPanel from "@/components/equipment-table/EquipmentFiltersPanel";
import {usePathname, useSearchParams} from "next/navigation"

interface EquipmentDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  variant: 'main' | 'other'
  showFilters: boolean
  userRole: number
  reload: () => Promise<void> | void
  isDataLoading: boolean
}

const EQUIPMENT_TABLE_STATE_QUERY_PARAM = "equipment_state"

const TEXT_FILTER_IDS = new Set([
  "model",
  "serial_number",
  "inventory_number",
  "network_name",
])

const MULTI_FILTER_IDS = new Set([
  "type_name",
  "responsible_user_full_name",
  "last_status_type",
  "building_adress",
  "room",
  "responsible_user_office",
])

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const sanitizeFilterValue = (id: string, value: unknown): unknown => {
  if (TEXT_FILTER_IDS.has(id)) {
    return typeof value === "string" ? value : undefined
  }

  if (MULTI_FILTER_IDS.has(id)) {
    if (!Array.isArray(value)) return undefined
    return value.filter((item): item is string => typeof item === "string")
  }

  if (id === "accepted_date") {
    if (!isObjectRecord(value)) return undefined

    const from = typeof value.from === "string" ? value.from : undefined
    const to = typeof value.to === "string" ? value.to : undefined

    if (!from && !to) return undefined

    return {from, to}
  }

  return undefined
}

const isEmptyFilterValue = (value: unknown) => {
  if (typeof value === "string") return value === ""
  if (Array.isArray(value)) return value.length === 0

  if (isObjectRecord(value)) {
    const from = typeof value.from === "string" ? value.from : undefined
    const to = typeof value.to === "string" ? value.to : undefined

    return !from && !to
  }

  return value === undefined
}

const parsePersistedTableState = (raw: string | null) => {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isObjectRecord(parsed)) return null

    const filtersSource = isObjectRecord(parsed.filters) ? parsed.filters : {}
    const filters = Object.entries(filtersSource).reduce<ColumnFiltersState>((acc, [id, value]) => {
      const normalized = sanitizeFilterValue(id, value)

      if (normalized === undefined || isEmptyFilterValue(normalized)) return acc

      acc.push({id, value: normalized})
      return acc
    }, [])

    const page =
      typeof parsed.page === "number" && Number.isInteger(parsed.page) && parsed.page > 0
        ? parsed.page - 1
        : 0

    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((item): item is string => typeof item === "string")
      : []

    return {
      filters,
      page,
      categories: Array.from(new Set(categories)),
    }
  } catch {
    return null
  }
}

const serializeTableState = ({
                              filters,
                              pageIndex,
                              selectedCategories,
                            }: {
  filters: ColumnFiltersState
  pageIndex: number
  selectedCategories: string[]
}) => {
  const normalizedFilters = filters.reduce<Record<string, unknown>>((acc, filter) => {
    const normalized = sanitizeFilterValue(filter.id, filter.value)

    if (normalized === undefined || isEmptyFilterValue(normalized)) return acc

    acc[filter.id] = normalized
    return acc
  }, {})

  const categories = Array.from(new Set(selectedCategories.filter(Boolean)))

  const hasFilters = Object.keys(normalizedFilters).length > 0
  const hasCategories = categories.length > 0
  const hasPage = pageIndex > 0

  if (!hasFilters && !hasCategories && !hasPage) return null

  return JSON.stringify({
    ...(hasPage ? {page: pageIndex + 1} : {}),
    ...(hasFilters ? {filters: normalizedFilters} : {}),
    ...(hasCategories ? {categories} : {}),
  })
}

export function EquipmentDataTable<TData, TValue>({
                                                     columns,
                                                     data,
                                                     variant,
                                                     showFilters,
                                                     userRole,
                                                     reload,
                                                     isDataLoading
                                                   }: EquipmentDataTableProps<TData, TValue>) {
  const actionsAllowed = userRole >= 3
  const persistStateInUrl = variant === 'main' && showFilters

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const skipFirstUrlSyncRef = React.useRef(true)

  const initialTableStateRef = React.useRef<{
    filters: ColumnFiltersState
    page: number
    categories: string[]
  } | null>(null)

  if (initialTableStateRef.current === null) {
    initialTableStateRef.current = persistStateInUrl
      ? parsePersistedTableState(searchParams.get(EQUIPMENT_TABLE_STATE_QUERY_PARAM)) ?? {
        filters: [],
        page: 0,
        categories: [],
      }
      : {
        filters: [],
        page: 0,
        categories: [],
      }
  }

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialTableStateRef.current.filters
  )
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    last_status_color: false,
    remarks: variant === 'other',
    network_name: variant === 'other',
    responsible_user_office: variant === 'other' && actionsAllowed,
    responsible_user_full_name: variant === 'main' && actionsAllowed,
    additional_info: variant === 'main' && showFilters && actionsAllowed,
    last_status_type: variant === 'main' && actionsAllowed,
    building_adress: variant === 'main' && actionsAllowed,
    room: variant === 'main' && actionsAllowed,
    type_name: variant === 'main',
    model: variant === 'main',
    serial_number: variant === 'main',
    inventory_number: variant === 'main',
    accepted_date: variant === 'main',
  })
  const [pagination, setPagination] = React.useState({
    pageIndex: initialTableStateRef.current.page,
    pageSize: 10,
  })

  const [filterOptions, setFilterOptions] = React.useState({
    types: [] as { value: string; label: string }[],
    statuses: [] as { value: string; label: string; color?: string }[],
    buildings: [] as { value: string; label: string }[],
    responsible_users: [] as { value: string; label: string }[],
    offices: [] as { value: string; label: string }[],
    rooms: [] as { value: string; label: string; buildingValue: string }[],
    categories: [] as { value: string; label: string, typeNames: string[] }[],
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination
    },
    meta: {
      reload
    }
  })

  const [isFormOpen, setIsFormOpen] = React.useState<boolean>(false)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    initialTableStateRef.current.categories
  )

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          typesRes,
          statusesRes,
          buildingsRes,
          responsible_usersRes,
          officesRes,
          roomsRes,
          categoriesRes,
        ] = await Promise.all([
          axios.get(API_URL + "/equipment_types/all"),
          axios.get(API_URL + "/equipment_status_type/all"),
          axios.get(API_URL + "/building/all"),
          axios.get(API_URL + "/responsible_users/all"),
          axios.get(API_URL + "/responsible_users/office/all"),
          axios.get(API_URL + "/room/all"),
          axios.get(API_URL + "/category/all"),
        ])

        setFilterOptions({
          types: typesRes.data.map((t: any) => ({
            value: t.type_name,
            label: t.type_name,
          })),
          statuses: statusesRes.data.map((s: any) => ({
            value: s.status_type_name,
            label: s.status_type_name,
            color: s.status_type_color,
          })),
          buildings: buildingsRes.data.map((b: any) => ({
            value: b.building_address,
            label: b.building_address,
          })),
          responsible_users: responsible_usersRes.data.map((u: any) => ({
            value: u.full_name,
            label: u.full_name,
          })),
          offices: officesRes.data.map((o: any) => ({
            value: o.office_name,
            label: o.office_name,
          })),
          rooms: roomsRes.data.map((r: any) => ({
            value: `${r.name} (${r.room_type?.room_type ?? ""}) - ${r.building.building_address}`.trim(),
            label: `${r.name} (${r.room_type?.room_type ?? ""}) - ${r.building.building_address}`.trim(),
            buildingValue: r.building?.building_address ?? "",
          })),
          categories: categoriesRes.data.map((c: any) => ({
            value: c.category_name,
            label: c.category_name,
            typeNames: (c.types ?? []).map((t: any) => t.type_name),
          })),
        })
      } catch (e) {
        console.log("Ошибка при загрузке фильтров", e)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (isDataLoading) return

    const pageCount = table.getPageCount()
    const maxIndex = Math.max(pageCount - 1, 0)

    if (pagination.pageIndex > maxIndex) {
      table.setPageIndex(maxIndex)
    }
  }, [isDataLoading, table, pagination.pageIndex, pagination.pageSize, table.getPageCount()])

  useEffect(() => {
    if (!persistStateInUrl) return
    if (isDataLoading) return

    if (skipFirstUrlSyncRef.current) {
      skipFirstUrlSyncRef.current = false
      return
    }

    if (typeof window === "undefined") return

    const serializedState = serializeTableState({
      filters: columnFilters,
      pageIndex: pagination.pageIndex,
      selectedCategories,
    })

    const params = new URLSearchParams(window.location.search)

    if (serializedState) {
      params.set(EQUIPMENT_TABLE_STATE_QUERY_PARAM, serializedState)
    } else {
      params.delete(EQUIPMENT_TABLE_STATE_QUERY_PARAM)
    }

    const nextQuery = params.toString()
    const currentQuery = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search
    const currentPathname = pathname || window.location.pathname

    if (nextQuery === currentQuery) return

    window.history.replaceState(
      window.history.state,
      "",
      nextQuery ? `${currentPathname}?${nextQuery}` : currentPathname
    )
  }, [
    columnFilters,
    isDataLoading,
    pagination.pageIndex,
    pathname,
    persistStateInUrl,
    selectedCategories,
  ])

  return (
    <>
      <Action
        title="Создать оборудование"
        description={<>Заполните все поля и нажмите кнопку <b>Создать</b></>}
        form={<EquipmentAddForm onSuccess={async () => {
          setIsFormOpen(false)
          await reload()
        }}/>}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />
      <div className="w-full h-full">
        {showFilters && <div className="flex items-end justify-between py-4">
          <EquipmentFiltersPanel
            table={table}
            actionsAllowed={actionsAllowed}
            filterOptions={filterOptions}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
          <div className="flex gap-2">
            <ReportDownloadButton
              className="bg-blue-2 hover:bg-blue-700"
              apiEndpoint={API_URL + "/equipment/to_excel_file"}
              tableData={table.getFilteredRowModel().rows.map(r => r.original)}
            />
            {actionsAllowed && <Button
              className="bg-blue-2 hover:bg-blue-700"
              onClick={() => setIsFormOpen(true)}
            >
              Добавить запись
            </Button>}
          </div>
        </div>}
        <div className="rounded-md border overflow-y-auto">
          <Table className={"text-center"}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className='text-center'>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Нет записей
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {showFilters && <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {pagination.pageIndex + 1} из {Math.max(table.getPageOptions().length, 1)} {" "} {CorrectPagesCase(table.getPageOptions().length)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.previousPage()
            }}
            disabled={!table.getCanPreviousPage()}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.nextPage()
            }}
            disabled={!table.getCanNextPage()}
          >
            Вперед
          </Button>
        </div>}
      </div>
    </>
  )
}
