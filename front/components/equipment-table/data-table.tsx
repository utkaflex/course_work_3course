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

interface EquipmentDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  variant: 'main' | 'other'
  showFilters: boolean
  userRole: number
}

export function EquipmentDataTable<TData, TValue>({
                                                    columns,
                                                    data,
                                                    variant,
                                                    showFilters,
                                                    userRole
                                                  }: EquipmentDataTableProps<TData, TValue>) {
  const actionsAllowed = userRole >= 3

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
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
    pageIndex: 0,
    pageSize: 10,
  })

  const [filterOptions, setFilterOptions] = React.useState({
    types: [] as { value: string; label: string }[],
    statuses: [] as { value: string; label: string; color?: string }[],
    buildings: [] as { value: string; label: string }[],
    responsible_users: [] as { value: string; label: string }[],
    offices: [] as { value: string; label: string }[],
    rooms: [] as { value: string; label: string }[],
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination
    }
  })

  const [isFormOpen, setIsFormOpen] = React.useState<boolean>(false)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])

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
            value: `${r.name} (${r.room_type?.room_type ?? ""})`.trim(),
            label: `${r.name} (${r.room_type?.room_type ?? ""})`.trim(),
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
    const typeCol = table.getColumn("type_name")
    if (!typeCol) return

    if (!selectedCategories.length) {
      typeCol.setFilterValue([])
      return
    }

    const unionTypeNames = Array.from(
      new Set(
        filterOptions.categories
          .filter(c => selectedCategories.includes(c.value))
          .flatMap(c => c.typeNames)
      )
    )

    typeCol.setFilterValue(unionTypeNames)
  }, [selectedCategories, filterOptions.categories])

  const acceptedDateFilter = (table.getColumn("accepted_date")?.getFilterValue() as
    { from?: string; to?: string }) ?? {}

  const setAcceptedDateFilter = (patch: Partial<{ from?: string; to?: string }>) => {
    table.getColumn("accepted_date")?.setFilterValue({
      ...acceptedDateFilter,
      ...patch,
    })
  }

  return (
    <>
      <Action
        title="Создать оборудование"
        description={<>Заполните все поля и нажмите кнопку <b>Создать</b></>}
        form={<EquipmentAddForm/>}
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
          <Table className={"text-sm text-center"}>
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
