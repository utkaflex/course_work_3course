"use client"

import {ResponsibleUserJobSchema} from "@/schemas";
import ResponsibleUserJobUpdateForm from "./responsible-user-job-update-form";
import ResponsibleUserJobAddForm from "./responsible-user-job-add-form";

import {ColumnDef} from "@tanstack/react-table";
import {z} from "zod";
import {API_URL} from "@/constants";
import DeleteRowForm from "../delete-row-form";
import ActionsButton from "../actions-button";

export const ResponsibleUserJobTableColumns: ColumnDef<z.infer<typeof ResponsibleUserJobSchema>>[] = [
  {
    accessorKey: "job_name",
    header: "Наименование должности"
  },
  {
    id: "actions",
    cell: ({row}) => {
      const actionsData = [
        {
          title: "Изменить должность",
          description: <>Заполните все поля и нажмите кнопку <b>Изменить</b></>,
          form: <ResponsibleUserJobUpdateForm id={row.getValue("id")}/>,
          dropdownButtonText: "Изменить"
        },
        {
          title: "Скопировать должность",
          description: <>Проверьте данные и нажмите кнопку <b>Создать</b></>,
          form: <ResponsibleUserJobAddForm copyFromId={row.getValue("id")}/>,
          dropdownButtonText: "Скопировать"
        },
        {
          title: "Удалить должность",
          description: <>Вы уверены что хотите удалить должность <b>{row.getValue("job_name")}</b>? Это удалит всех
            ответственных лиц с данной должностью.</>,
          form: <DeleteRowForm
            apiEndpoint={API_URL + `/responsible_users/job/${row.getValue("id")}`}
            toastText="Должность успешно удалена"
            calledFrom="responsible_users_jobs"
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
    accessorKey: "id",
  }
]
