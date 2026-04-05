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

const EquipmentStatusAddForm = ({
                                  copyFromId,
                                  equipmentId,
                                  onClose,
                                  onSuccess
                                }: {
  copyFromId?: number
  equipmentId: number
  onClose?: () => void
  onSuccess?: () => void | Promise<void>
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
            color: status.status_type_color,
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
        setLoading(false)
      } catch (e) {
        console.log("Ошибка при получении данных о статусе")
        console.log(e)
      }
    }

    fetchData()
  }, [])

  const form = useForm<z.infer<typeof EquipmentStatusFormSchema>>({
    resolver: zodResolver(EquipmentStatusFormSchema),
    defaultValues: {
      doc_number: "",
      remarks: "",
      status_change_date: "",
      status_type_id: 0,
      responsible_user_id: 0,
      room_id: 0,
      equipment_id: equipmentId
    }
  });

  useEffect(() => {
    if (copyFromId === undefined) return

    const fetchCopyData = async () => {
      try {
        const status = (await axios.get(API_URL + `/equipment_status/${copyFromId}`)).data
        form.reset({
          doc_number: status?.doc_number ?? "",
          remarks: status?.remarks ?? "",
          status_change_date: status?.status_change_date ?? "",
          status_type_id: status?.status_type_id ?? 0,
          responsible_user_id: status?.responsible_user_id ?? 0,
          room_id: status?.room_id ?? 0,
          equipment_id: equipmentId,
        })
      } catch (e) {
        console.log("Ошибка загрузки данных для копирования статуса оборудования")
        console.log(e)
      }
    }

    fetchCopyData()
  }, [copyFromId, equipmentId, form])

  function AddRowEquipmentStatusTable(data: z.infer<typeof EquipmentStatusFormSchema>) {
    setError("")
    setIsProcessing(true)
    axios.post(API_URL + '/equipment_status/create', {
      doc_number: data.doc_number,
      remarks: data.remarks,
      status_change_date: new Date(),
      status_type_id: data.status_type_id,
      responsible_user_id: data.responsible_user_id,
      room_id: data.room_id,
      equipment_id: data.equipment_id,
    })
      .then(() => {
        toast({
          title: "Запись добавлена",
          description: "Данные записаны в БД",
          className: "bg-white"
        })
        onSuccess?.()
        onClose?.()
      })
      .catch((e) => {
        setError("Во время добавления записи произошла непредвиденная ошибка!")
        console.log("Unexpected error occured while adding row.")
        console.log(e)
        setIsProcessing(false)
      })
  }

  return (
    <CRUDFormForTables
      buttonText="Создать"
      form={form}
      id="addEquipmentStatusForm"
      onSubmit={AddRowEquipmentStatusTable}
      error={error}
      isProcessing={isProcessing}
      loading={loading}
      textFields={textFields}
      comboboxFields={comboboxFields}
    />
  )
}

export default EquipmentStatusAddForm
