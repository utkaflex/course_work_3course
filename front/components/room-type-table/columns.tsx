"use client"

import {RoomTypeSchema} from "@/schemas"
import RoomTypeUpdateForm from "./room-type-update-form"
import RoomTypeAddForm from "./room-type-add-form"
import {ColumnDef} from "@tanstack/react-table"
import {z} from "zod"
import {API_URL} from "@/constants"
import DeleteRowForm from "../delete-row-form"
import ActionsButton from "../actions-button"

export const RoomTypeTableColumns: ColumnDef<z.infer<typeof RoomTypeSchema>>[] = [
  {
    accessorKey: "room_type",
    header: "Тип помещения",
  },
  {
    id: "actions",
    cell: ({row}) => {
      const actionsData = [
        {
          title: "Изменить тип помещения",
          description: <>Заполните все поля и нажмите кнопку <b>Изменить</b></>,
          form: <RoomTypeUpdateForm id={row.getValue("id")}/>,
          dropdownButtonText: "Изменить",
        },
        {
          title: "Скопировать тип помещения",
          description: <>Проверьте данные и нажмите кнопку <b>Создать</b></>,
          form: <RoomTypeAddForm copyFromId={row.getValue("id")}/>,
          dropdownButtonText: "Скопировать",
        },
        {
          title: "Удалить тип помещения",
          description: (
            <>
              Вы уверены что хотите удалить тип помещения{" "}
              <b>{row.getValue("room_type")}</b>?
            </>
          ),
          form: (
            <DeleteRowForm
              apiEndpoint={API_URL + `/room_type/${row.getValue("id")}`}
              toastText="Тип помещения успешно удален"
              calledFrom="room_type"
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
