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

const RoomAddForm = () => {
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
    const fetchData = async () => {
      setLoading(true)
      try {
        const [bRes, rtRes] = await Promise.all([
          axios.get(API_URL + "/building/all"),
          axios.get(API_URL + "/room_type/all"),
        ])
        setBuildings(bRes.data)
        setRoomTypes(rtRes.data)
      } catch (e) {
        console.log("Ошибка загрузки данных для формы", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const AddRowRoomTable = (data: z.infer<typeof RoomFormSchema>) => {
    setError("")
    setIsProcessing(true)

    axios
      .post(API_URL + "/room/create", data)
      .then(() => {
        localStorage.setItem("last_tab", "room")
        window.location.reload()
        toast({
          title: "Помещение добавлено",
          description: "Данные записаны в БД",
          className: "bg-white",
        })
      })
      .catch((e) => {
        setError("Во время добавления записи произошла непредвиденная ошибка!")
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
      buttonText="Создать"
      form={form}
      id="addRoomForm"
      onSubmit={AddRowRoomTable}
      error={error}
      loading={loading}
      textFields={textFields}
      comboboxFields={comboboxFields}
      isProcessing={isProcessing}
    />
  )
}

export default RoomAddForm
