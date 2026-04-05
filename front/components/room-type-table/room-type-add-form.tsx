"use client"

import {RoomTypeFormSchema} from "@/schemas"
import React, {useEffect, useState} from "react"
import * as z from "zod"
import axios from "axios"
import {API_URL} from "@/constants"
import {zodResolver} from "@hookform/resolvers/zod"
import {useToast} from "@/hooks/use-toast"
import {useForm} from "react-hook-form"
import {textFields} from "./fields"
import CRUDFormForTables from "../crud-form-for-tables"

const RoomTypeAddForm = ({copyFromId}: {copyFromId?: number}) => {
  const [error, setError] = useState<string | undefined>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const {toast} = useToast()

  const form = useForm<z.infer<typeof RoomTypeFormSchema>>({
    resolver: zodResolver(RoomTypeFormSchema),
    defaultValues: {
      room_type: "",
    },
  })

  useEffect(() => {
    if (copyFromId === undefined) return

    const fetchCopyData = async () => {
      try {
        const response = await axios.get(API_URL + `/room_type/${copyFromId}`)
        form.reset({
          room_type: response.data?.room_type ?? "",
        })
      } catch (e) {
        console.log("Ошибка загрузки данных для копирования типа помещения")
        console.log(e)
      }
    }

    fetchCopyData()
  }, [copyFromId, form])

  function AddRowRoomTypeTable(data: z.infer<typeof RoomTypeFormSchema>) {
    setError("")
    setIsProcessing(true)

    axios
      .post(API_URL + "/room_type/create", data)
      .then(() => {
        localStorage.setItem("last_tab", "room_type")
        window.location.reload()
        toast({
          title: "Тип помещения добавлен",
          description: "Данные записаны в БД",
          className: "bg-white",
        })
      })
      .catch((e) => {
        if (e.response?.data?.detail === "Room type already exists") {
          setError("Такой тип помещения уже существует")
        } else {
          setError("Во время добавления произошла непредвиденная ошибка!")
          console.log(e)
        }
        setIsProcessing(false)
      })
  }

  return (
    <CRUDFormForTables
      buttonText="Создать"
      form={form}
      id="addRoomTypeForm"
      onSubmit={AddRowRoomTypeTable}
      error={error}
      isProcessing={isProcessing}
      textFields={textFields}
    />
  )
}

export default RoomTypeAddForm
