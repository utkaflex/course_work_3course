"use client"

import {CategorySchema} from "@/schemas"
import CategoryUpdateForm from "./category-update-form"
import {ColumnDef} from "@tanstack/react-table"
import {z} from "zod"
import {API_URL} from "@/constants"
import DeleteRowForm from "../delete-row-form"
import ActionsButton from "../actions-button"

export const CategoryTableColumns: ColumnDef<z.infer<typeof CategorySchema>>[] = [
  {
    accessorKey: "category_name",
    header: "Категория",
  },
  {
    id: "types",
    header: "Типы оборудования",
    cell: ({row}) => {
      const types = row.original.types ?? []
      return (
        <div className="flex flex-wrap gap-1">
          {types.map((t) => (
            <span
              key={t.id}
              className="px-2 py-0.5 rounded bg-muted text-xs"
            >
              {t.type_name}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({row}) => {
      const actionsData = [
        {
          title: "Изменить категорию",
          description: <>Заполните все поля и нажмите кнопку <b>Изменить</b></>,
          form: <CategoryUpdateForm id={row.getValue("id")}/>,
          dropdownButtonText: "Изменить",
        },
        {
          title: "Удалить категорию",
          description: (
            <>
              Вы уверены что хотите удалить категорию{" "}
              <b>{row.getValue("category_name")}</b>?
            </>
          ),
          form: (
            <DeleteRowForm
              apiEndpoint={API_URL + `/category/${row.getValue("id")}`}
              toastText="Категория успешно удалена"
              calledFrom="category"
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
