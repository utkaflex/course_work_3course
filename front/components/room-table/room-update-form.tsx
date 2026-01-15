"use client"

import React, {useEffect, useState} from "react"
import * as z from "zod"
import axios from "axios"
import {API_URL} from "@/constants"
import {zodResolver} from "@hookform/resolvers/zod"
import {useToast} from "@/hooks/use-toast"
import {useForm} from "react-hook-form"
import CRUDFormForTables from "../crud-form-for-tables"
import {RoomFormSchema} from "@/schemas"
import {textFields} from "./fields"

type Building = { id: number; building_address: string }
type RoomType = { id: number; room_type: string }

const RoomUpdateForm = ({id}: { id: number }) => {
  const [error, setError] = useState<string | undefined>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [buildings, setBuildings] = useState<Building[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])

  const {toast} = useToast()

  const form = useForm<z.infer<typeof RoomFormSchema>>({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      name: "",
      building_id: 0,
      room_type_id: 0,
    },
  })

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [roomRes, bRes, rtRes] = await Promise.all([
          axios.get(API_URL + `/room/${id}`),
          axios.get(API_URL + "/building/all"),
          axios.get(API_URL + "/room_type/all"),
        ])

        setBuildings(bRes.data)
        setRoomTypes(rtRes.data)

        const room = roomRes.data
        form.reset({
          name: room.name ?? "",
          building_id: room.building?.id ?? 0,
          room_type_id: room.room_type?.id ?? 0,
        })
      } catch (e) {
        console.log("Ошибка загрузки данных помещения", e)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [id])

  const UpdateRowRoomTable = (data: z.infer<typeof RoomFormSchema>) => {
    setError("")
    setIsProcessing(true)

    axios
      .put(API_URL + `/room/${id}`, data)
      .then(() => {
        localStorage.setItem("last_tab", "room")
        window.location.reload()
        toast({
          title: "Помещение обновлено",
          description: "Данные записаны в БД",
          className: "bg-white",
        })
      })
      .catch((e) => {
        setError("Ошибка при обновлении записи!")
        console.log(e)
        setIsProcessing(false)
      })
  }

  const comboboxFields = [
    {
      name: "building_id",
      label: "Корпус (адрес)",
      data: buildings,
      value_field: "building_address",
      id_field: "id",
      frontText: "Выберите корпус",
      inputPlaceholder: "Поиск корпуса...",
      emptyText: "Корпуса не найдены",
    },
    {
      name: "room_type_id",
      label: "Тип помещения",
      data: roomTypes,
      value_field: "room_type",
      id_field: "id",
      frontText: "Выберите тип помещения",
      inputPlaceholder: "Поиск типа...",
      emptyText: "Типы помещений не найдены",
    },
  ]

  return (
    <CRUDFormForTables
      buttonText="Изменить"
      form={form}
      id="updateRoomForm"
      onSubmit={UpdateRowRoomTable}
      error={error}
      loading={loading}
      textFields={textFields}
      comboboxFields={comboboxFields}
      isProcessing={isProcessing}
    />
  )
}

export default RoomUpdateForm
