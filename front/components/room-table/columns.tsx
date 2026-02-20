"use client"

import {ColumnDef} from "@tanstack/react-table"
import {z} from "zod"
import {RoomSchema} from "@/schemas"
import {API_URL} from "@/constants"
import DeleteRowForm from "../delete-row-form"
import ActionsButton from "../actions-button"
import RoomUpdateForm from "./room-update-form"
import {sortableHeader} from "@/components/sortable-header";

export const RoomTableColumns: ColumnDef<z.infer<typeof RoomSchema>>[] = [
  {
    accessorKey: "name",
    header: sortableHeader("Помещение"),
  },
  {
    id: "building_address",
    header: sortableHeader("Корпус (адрес)"),
    accessorFn: (row) => row.building?.building_address ?? "",
  },
  {
    id: "room_type_name",
    header: sortableHeader("Тип помещения"),
    accessorFn: (row) => row.room_type?.room_type ?? "",
  },
  {
    id: "actions",
    cell: ({row, table}) => {
      const reload = table.options.meta?.reload

      const actionsData = [
        {
          title: "Изменить помещение",
          description: <>Заполните все поля и нажмите кнопку <b>Изменить</b></>,
          form: <RoomUpdateForm id={row.getValue("id")} onSuccess={async () => {
            await reload?.()
          }}/>,
          dropdownButtonText: "Изменить",
        },
        {
          title: "Удалить помещение",
          description: (
            <>
              Вы уверены что хотите удалить помещение <b>{row.getValue("name")}</b>?
            </>
          ),
          form: (
            <DeleteRowForm
              apiEndpoint={API_URL + `/room/${row.getValue("id")}`}
              toastText="Помещение успешно удалено"
              calledFrom="rooms"
              onSuccess={async () => {
                await reload?.()
              }}
            />
          ),
          dropdownButtonText: "Удалить",
        },
      ]
      return <ActionsButton actionsData={actionsData}/>
    },
  },
  {
    accessorKey: "id",
  },
]
