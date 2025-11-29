"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CorrectPagesCase } from "../helper-functions"
import EquipmentAddForm from "./equipment-add-form"
import DownloadButton from "../download-button"
import { API_URL } from "@/constants"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import Action from "../action"
import { DataTableComboboxFilter } from "../data-table-combobox-filter"
import {useEffect} from "react";
import axios from "axios";

interface EquipmentDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  forStatus: boolean,
  userRole: number
}

export function EquipmentDataTable<TData, TValue>({
  columns,
  data,
  forStatus,
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
    remarks: !forStatus,
    responsible_user_office: !forStatus && actionsAllowed,
    responsible_user_full_name: !forStatus && actionsAllowed,
    additional_info: !forStatus && actionsAllowed,
    last_status_type: !forStatus && actionsAllowed,
    actions: !forStatus && actionsAllowed,
    building_adress: !forStatus && actionsAllowed,
  })
  const [currentPageNumber, setCurrentPageNumber] = React.useState<number>(1)

  const [filterOptions, setFilterOptions] = React.useState({
    types: [] as { value: string; label: string }[],
    statuses: [] as { value: string; label: string; color?: string }[],
    buildings: [] as { value: string; label: string }[],
    responsible_users: [] as { value: string; label: string }[],
    offices: [] as { value: string; label: string }[]
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    }
  })

  const [isFormOpen, setIsFormOpen] = React.useState<boolean>(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          typesRes,
          statusesRes,
          buildingsRes,
          responsible_usersRes,
          officesRes,
        ] = await Promise.all([
          axios.get(API_URL + "/equipment_types/all"),
          axios.get(API_URL + "/equipment_status_type/all"),
          axios.get(API_URL + "/buildings/all"),
          axios.get(API_URL + "/responsible_users/all"),
          axios.get(API_URL + "/responsible_users/office/all"),
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
          }))
        })
      } catch (e) {
        console.log("Ошибка при загрузке фильтров", e)
      }
    }
    fetchAll()
  }, [])

  return (
    <>
      <Action
        title="Создать оборудование"
        description={<>Заполните все поля и нажмите кнопку <b>Создать</b></>}
        form={<EquipmentAddForm />}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />
      <div className="w-full h-full">
        {!forStatus && <div className="flex items-start justify-between py-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-0 px-1">
            <AccordionTrigger className="flex h-[40px] min-w-[100px] max-w-[100px] py-0">Фильтры</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 p-1">
              {/*TODO оставил закомментированным*/}
              {/*<Input*/}
              {/*  placeholder="Фильтр по типу оборудования..."*/}
              {/*  value={(table.getColumn("type_name")?.getFilterValue() as string) ?? ""}*/}
              {/*  onChange={(event) =>*/}
              {/*    table.getColumn("type_name")?.setFilterValue(event.target.value)*/}
              {/*  }*/}
              {/*  className="w-[300px]"*/}
              {/*/>*/}
              <DataTableComboboxFilter
                column={table.getColumn("type_name")}
                options={filterOptions.types}
                placeholder="Фильтр по типу оборудования..."
                searchPlaceholder="Поиск типа..."
                emptyText="Типы не найдены"
              />

              <Input
                placeholder="Фильтр по модели оборудования..."
                value={(table.getColumn("model")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("model")?.setFilterValue(event.target.value)
                }
                className="w-[300px]"
              />
              <Input
                placeholder="Фильтр по серийному номеру..."
                value={(table.getColumn("serial_number")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("serial_number")?.setFilterValue(event.target.value)
                }
                className="w-[300px]"
              />
              <Input
                placeholder="Фильтр по инвентарному номеру..."
                value={(table.getColumn("inventory_number")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("inventory_number")?.setFilterValue(event.target.value)
                }
                className="w-[300px]"
              />
              <Input
                placeholder="Фильтр по сетевому имени..."
                value={(table.getColumn("network_name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("network_name")?.setFilterValue(event.target.value)
                }
                className="w-[300px]"
              />
              {/*{actionsAllowed && <Input*/}
              {/*  placeholder="Фильтр по ФИО ответственного лица..."*/}
              {/*  value={(table.getColumn("responsible_user_full_name")?.getFilterValue() as string) ?? ""}*/}
              {/*  onChange={(event) =>*/}
              {/*    table.getColumn("responsible_user_full_name")?.setFilterValue(event.target.value)*/}
              {/*  }*/}
              {/*  className="w-[300px]"*/}
              {/*/>*/}
              {/*}*/}

              {actionsAllowed && <DataTableComboboxFilter
                column={table.getColumn("responsible_user_full_name")}
                options={filterOptions.responsible_users}
                placeholder="Фильтр по ответственному лицу..."
                searchPlaceholder="Поиск ответственного лица..."
                emptyText="Ответственное лицо не найдено"
              />
              }

              {/*{actionsAllowed && <Input*/}
              {/*  placeholder="Фильтр по статусу..."*/}
              {/*  value={(table.getColumn("last_status_type")?.getFilterValue() as string) ?? ""}*/}
              {/*  onChange={(event) =>*/}
              {/*    table.getColumn("last_status_type")?.setFilterValue(event.target.value)*/}
              {/*  }*/}
              {/*  className="w-[300px]"*/}
              {/*/>}*/}
              {actionsAllowed && <DataTableComboboxFilter
                column={table.getColumn("last_status_type")}
                options={filterOptions.statuses}
                placeholder="Фильтр по статусу..."
                searchPlaceholder="Поиск статуса..."
                emptyText="Статус не найден"
              />}
              {/*{actionsAllowed && <Input*/}
              {/*  placeholder="Фильтр по адресу..."*/}
              {/*  value={(table.getColumn("building_adress")?.getFilterValue() as string) ?? ""}*/}
              {/*  onChange={(event) =>*/}
              {/*    table.getColumn("building_adress")?.setFilterValue(event.target.value)*/}
              {/*  }*/}
              {/*  className="w-[300px]"*/}
              {/*/>}*/}
              {actionsAllowed && <DataTableComboboxFilter
                column={table.getColumn("building_adress")}
                options={filterOptions.buildings}
                placeholder="Фильтр по адресу..."
                searchPlaceholder="Поиск адреса..."
                emptyText="Адрес не найден"
              />}
              {/*{actionsAllowed && <Input*/}
              {/*  placeholder="Фильтр по подразделению..."*/}
              {/*  value={(table.getColumn("responsible_user_office")?.getFilterValue() as string) ?? ""}*/}
              {/*  onChange={(event) =>*/}
              {/*    table.getColumn("responsible_user_office")?.setFilterValue(event.target.value)*/}
              {/*  }*/}
              {/*  className="w-[300px]"*/}
              {/*/>}*/}
              {actionsAllowed && <DataTableComboboxFilter
                column={table.getColumn("responsible_user_office")}
                options={filterOptions.offices}
                placeholder="Фильтр по подразделению..."
                searchPlaceholder="Поиск подразделения..."
                emptyText="Подразделение не найдено"
              />}
            </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex gap-2">
            <DownloadButton
              className="bg-blue-2 hover:bg-blue-700"
              apiEndpoint={API_URL + "/equipment/to_excel_file"}
              buttonText="Выгрузить в Excel"
              tableData={table.getFilteredRowModel().rows.map(row => row.original)}
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
          <Table className={"text-"}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
        {!forStatus && <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {currentPageNumber} из {Math.max(table.getPageOptions().length, 1)} {" "} {CorrectPagesCase(table.getPageOptions().length)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPageNumber(currentPageNumber - 1)
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
              setCurrentPageNumber(currentPageNumber + 1)
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
