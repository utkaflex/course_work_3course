"use client"

import {EquipmentStatusTableSchema} from "@/schemas";
import {ColumnDef} from "@tanstack/react-table";
import {z} from "zod";
import EquipmentStatusUpdateForm from "./equipment-status-update-form";
import {DatetimeFromDbForm} from "../helper-functions";
import {API_URL} from "@/constants";
import DeleteRowForm from "../delete-row-form";
import ActionsButton from "../actions-button";
import {ArrowUpDown} from "lucide-react";
import {Button} from "../ui/button";
import {sortableHeader} from "@/components/sortable-header";

export const EquipmentStatusTableColumns: ColumnDef<z.infer<typeof EquipmentStatusTableSchema>>[] = [
  {
    accessorKey: "status_type_name",
    header: sortableHeader("Статус"),
    cell: ({row}) => {
      const color: string = row.getValue("status_type_color");
      return (
        <span style={{color}}>
                    {row.getValue("status_type_name")}
                </span>
      );
    }
  },
  {
    accessorKey: "doc_number",
    header: sortableHeader("Номер договора"),
  },
  {
    accessorKey: "status_change_date",
    header: ({column}) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Дата изменения статуса
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>
      )
    },
    cell: ({row}) => {
      return DatetimeFromDbForm(row.getValue("status_change_date"))
    }
  },
  {
    accessorKey: "responsible_user_fio",
    header: sortableHeader("ФИО ответственного"),
  },
  {
    accessorKey: "responsible_user_job_name",
    header: sortableHeader("Должность ответственного"),
  },

  {
    accessorKey: "responsible_user_office_name",
    header: sortableHeader("Подразделение ответственного"),
  },
  {
    accessorKey: "room_label",
    header: sortableHeader("Помещение"),
  },
  {
    accessorKey: "building_address",
    header: sortableHeader("Адрес учебного корпуса"),
  },
  {
    id: "actions",
    cell: ({row, table}) => {
      const reload = table.options.meta?.reload

      const actionsData = [
        {
          title: "Изменить статус ПО",
          description: <>Заполните все поля и нажмите кнопку <b>Изменить</b></>,
          form: <EquipmentStatusUpdateForm id={row.getValue("id")} onSuccess={async () => {
            await reload?.()
          }}/>,
          dropdownButtonText: "Изменить"
        },
        {
          title: "Удалить статус ПО",
          description: <>Вы уверены что хотите удалить статус ПО <b>{row.getValue("status_type_name")}</b>?</>,
          form: <DeleteRowForm
            apiEndpoint={API_URL + `/equipment_status/${row.getValue("id")}`}
            toastText="Статус успешно удален"
            onSuccess={async () => {
              await reload?.()
            }}
          />,
          dropdownButtonText: "Удалить"
        }
      ]
      return (
        <ActionsButton actionsData={actionsData}/>
      )
    },
  },
  {
    accessorKey: "id"
  },
  {
    accessorKey: "equipment_id"
  },
  {
    accessorKey: "status_type_color",
  },
]
