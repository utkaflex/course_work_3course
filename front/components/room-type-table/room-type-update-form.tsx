"use client"

import {RoomTypeFormSchema} from "@/schemas"
import {useToast} from "@/hooks/use-toast"
import React, {useEffect, useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import axios from "axios"
import {API_URL} from "@/constants"
import {textFields} from "./fields"
import CRUDFormForTables from "../crud-form-for-tables"

const RoomTypeUpdateForm = ({id}: { id: number }) => {
  const [error, setError] = useState<string | undefined>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const {toast} = useToast()

  const form = useForm<z.infer<typeof RoomTypeFormSchema>>({
    resolver: zodResolver(RoomTypeFormSchema),
    defaultValues: {
      room_type: "",
    },
  })

  useEffect(() => {
    setLoading(true)

    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL + `/room_type/${id}`)
        form.reset(response.data)
      } catch (e) {
        console.log("Ошибка загрузки данных room_type")
        console.log(e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const UpdateRowRoomTypeTable = (data: z.infer<typeof RoomTypeFormSchema>) => {
    setError("")
    setIsProcessing(true)

    axios
      .put(API_URL + `/room_type/${id}`, data)
      .then(() => {
        localStorage.setItem("last_tab", "room_type")
        window.location.reload()
        toast({
          title: "Тип помещения обновлен",
          description: "Данные записаны в БД",
          className: "bg-white",
        })
      })
      .catch((e) => {
        if (e.response?.data?.detail === "Room type already exists") {
          setError("Такой тип помещения уже существует")
        } else {
          setError("Ошибка при обновлении записи!")
          console.log(e)
        }
        setIsProcessing(false)
      })
  }

  return (
    <CRUDFormForTables
      buttonText="Изменить"
      form={form}
      id="updateRoomTypeForm"
      onSubmit={UpdateRowRoomTypeTable}
      error={error}
      isProcessing={isProcessing}
      loading={loading}
      textFields={textFields}
    />
  )
}

export default RoomTypeUpdateForm
