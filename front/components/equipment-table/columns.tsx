"use client"

import { EquipmentSchema } from "@/schemas";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import EquipmentUpdateForm from "./equipment-update-form";
import { Button } from "../ui/button";
import Link from "next/link";
import { API_URL } from "@/constants";
import DeleteRowForm from "../delete-row-form";
import ActionsButton from "../actions-button";
import { ArrowUpDown } from "lucide-react";
import { DateFromDbForm } from "../helper-functions";

export const EquipmentTableColumns: ColumnDef<z.infer<typeof EquipmentSchema>>[] = [
    {
        accessorKey: "type_name",
        header: "Тип оборудования",
    },
    {
        accessorKey: "model",
        header: "Модель оборудования",
    },
    {
        id: "additional_info",
        header: "Подробная информация",
        cell: ({ row }) => {
            const actionsData = [
                {
                    title: "Изменить оборудование",
                    description: <>Заполните все поля и нажмите кнопку <b>Изменить</b></>,
                    form: <EquipmentUpdateForm id={row.getValue("id")} />,
                    dropdownButtonText: "Изменить"
                },
                {
                    title: "Удалить оборудование",
                    description: <>Вы уверены что хотите удалить оборудование <b>{row.getValue("model")}</b>? Это удалит его характеристики и статусы (при наличии).</>,
                    form: <DeleteRowForm
                      apiEndpoint={API_URL + `/equipment/${row.getValue("id")}`}
                      toastText="Оборудование успешно удалено"
                      calledFrom="equipment"
                    />,
                    dropdownButtonText: "Удалить"
                }
            ]
            return (
                <div className='flex flex-nowrap'>
                    <Link href={`characteristics/${row.getValue("id")}`}>
                        <Button className="h-8 w-fit p-2 bg-gray-100 hover:text-white hover:bg-gray-400
                            border-[1px] border-gray-400 text-black">
                            Показать
                        </Button>
                    </Link>

                    <ActionsButton actionsData={actionsData} />
                </div>
            )
        }
    },
    {
        accessorKey: "serial_number",
        header: "Серийный номер",
    },
    {
        accessorKey: "inventory_number",
        header: "Инвентарный номер",
    },
    {
        accessorKey: "responsible_user_office",
        header: "Подразделение ответственного"
    },
    {
        accessorKey: "responsible_user_full_name",
        header: "ФИО ответственного",
    },
    {
        accessorKey: "last_status_type",
        header: "Статус оборудования",
        cell: ({ row }) => {
            const color: string = row.getValue("last_status_color");
            return (
              <span style={{ color }}>
                    {row.getValue("last_status_type")}
                </span>
            );
        }
    },
    {
        accessorKey: "building_adress",
        header: "Адрес корпуса"
    },
    {
        accessorKey: "network_name",
        header: "Сетевое имя",
        cell: ({ row }) => {
            return row.getValue("network_name") ? row.getValue("network_name") : "Отсутствует"
        }
    },
    {
        accessorKey: "remarks",
        header: "Примечание",
        cell: ({ row }) => {
            return row.getValue("remarks") ? row.getValue("remarks") : "Отсутствует"
        }
    },
    {
        accessorKey: "accepted_date",
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                  Дата принятия к учету
                  <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
        },
        cell: ({ row }) => {
            return row.getValue("accepted_date") ? DateFromDbForm(row.getValue("accepted_date")) : "Отсутствует"
        },
        filterFn: (row, id, value) => {
            const { from, to } = (value ?? {}) as { from?: string; to?: string }

            const raw = row.getValue(id) as string | null
            if (!raw) return true // если даты нет — можно скрывать; если надо показывать — верни true

            // приводим дату строки к Date
            const parseRuDate = (s: string) => {
                const [dd, mm, yyyy] = s.split(".")
                return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
            }

            const rowDate = raw.includes(".") ? parseRuDate(raw) : new Date(raw)
            if (isNaN(rowDate.getTime())) return false

            if (from) {
                const fromDate = new Date(from)
                // с начала дня
                fromDate.setHours(0, 0, 0, 0)
                if (rowDate < fromDate) return false
            }

            if (to) {
                const toDate = new Date(to)
                // до конца дня
                toDate.setHours(23, 59, 59, 999)
                if (rowDate > toDate) return false
            }

            return true
        }
    },
    {
        accessorKey: "id"
    },
    {
        accessorKey: "last_status_color",
    },
]
