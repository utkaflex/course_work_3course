"use client"

import * as z from "zod"
import axios from "axios";
import {API_URL} from "@/constants";
import {zodResolver} from "@hookform/resolvers/zod"

import {useForm} from "react-hook-form"
import {useEffect, useState} from "react";
import {BuildingSchema, EquipmentStatusFormSchema, ResponsibleUserSchema, StatusSchema} from "@/schemas";

import {useToast} from "@/hooks/use-toast";
import {comboboxFields, DataArray, textFields} from './fields';
import CRUDFormForTables from '../crud-form-for-tables';

const EquipmentStatusUpdateForm = ({
                                     id
                                   }: {
  id: number
}) => {
  const [error, setError] = useState<string | undefined>("");
  const [loading, setLoading] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const {toast} = useToast()

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const statuses = (await axios.get(API_URL + `/equipment_status_type/all`)).data as z.infer<typeof StatusSchema>[]
        const statuses_for_combobox = await Promise.all(statuses.map(async status => {
          return {
            value: status.status_type_name,
            id: status.id
          } as DataArray
        })) as DataArray[]
        comboboxFields[0].data = statuses_for_combobox


        const responsible_users = (await axios.get(API_URL + `/responsible_users/all`)).data as z.infer<typeof ResponsibleUserSchema>[]
        const responsible_users_for_combobox = await Promise.all(responsible_users.map(async user => {
          const user_fio = user.full_name
          const user_job = user.job_name
          const user_office = user.office_name

          return {
            value: user_fio +
              (user_job ? ", " + user_job : "") +
              (user_office ? ", " + user_office : ""),
            id: user.id
          } as DataArray
        })) as DataArray[]
        comboboxFields[1].data = responsible_users_for_combobox

        const rooms = (await axios.get(API_URL + `/room/all`)).data
        const rooms_for_combobox = rooms.map((room: any) => ({
          id: room.id,
          value: `${room.name}, ${room.building?.building_address ?? ""}`,
        })) as DataArray[]

        comboboxFields[2].data = rooms_for_combobox
        try {
          const status = (await axios.get(API_URL + `/equipment_status/${id}`)).data
          form.reset({
            ...status,
            room_id: status.room_id ?? 0
          })
          setLoading(false)
        } catch (e) {
          console.log("Ошибка при получении данных о статусе")
          console.log(e)
        }

      } catch (e) {
        console.log("Ошибка при получении общих данных о статусе")
        console.log(e)
      }
    }

    fetchData()
  }, [])

  const form = useForm<z.infer<typeof EquipmentStatusFormSchema>>({
    resolver: zodResolver(EquipmentStatusFormSchema),
    defaultValues: {
      doc_number: "",
      status_change_date: "",
      status_type_id: 0,
      responsible_user_id: 0,
      building_id: 0,
      room_id: 0,
      equipment_id: 0
    }
  });

  function UpdateRowEquipmentStatusTable(data: z.infer<typeof EquipmentStatusFormSchema>) {
    setError("")
    setIsProcessing(true)
    axios.put(API_URL + `/equipment_status/${id}`, {
      doc_number: data.doc_number,
      status_change_date: new Date(),
      status_type_id: data.status_type_id,
      responsible_user_id: data.responsible_user_id,
      building_id: data.building_id,
      room_id: data.room_id,
      equipment_id: data.equipment_id,
    })
      .then(() => {
        window.location.reload()
        toast({
          title: "Статус обновлен",
          description: "Данные записаны в БД",
          className: "bg-white"
        })
      })
      .catch((e) => {
        if (e.response.data.detail === 'Room does not belong to building')
          setError("Указанное помещение относиться к другому адресу!")
        console.log("Unexpected error occured while adding row.")
        console.log(e)
        setIsProcessing(false)
      })
  }

  return (
    <CRUDFormForTables
      buttonText="Изменить"
      form={form}
      id="updateEquipmentStatusForm"
      onSubmit={UpdateRowEquipmentStatusTable}
      error={error}
      isProcessing={isProcessing}
      loading={loading}
      textFields={textFields}
      comboboxFields={comboboxFields}
    />
  )
}

export default EquipmentStatusUpdateForm
