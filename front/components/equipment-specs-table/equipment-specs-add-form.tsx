"use client"

import React, {useEffect, useState} from 'react'
import * as z from "zod"
import axios from "axios";
import {API_URL} from "@/constants";
import {zodResolver} from "@hookform/resolvers/zod"

import {useForm} from "react-hook-form"
import {EquipmentSpecsFormSchema} from "@/schemas";

import {useToast} from "@/hooks/use-toast";
import {textFields} from './fields';
import CRUDFormForTables from '../crud-form-for-tables';

const EquipmentSpecsAddForm = ({
                                 copyFromId,
                                 equipmentId
                               }: {
  copyFromId?: number
  equipmentId: number
}) => {
  const [error, setError] = useState<string | undefined>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const {toast} = useToast()

  const form = useForm<z.infer<typeof EquipmentSpecsFormSchema>>({
    resolver: zodResolver(EquipmentSpecsFormSchema),
    defaultValues: {
      screen_resolution: "",
      processor_type: "",
      ram_size: "",
      gpu_info: "",
      storage: "",
      equipment_id: equipmentId
    }
  });

  useEffect(() => {
    if (copyFromId === undefined) return

    const fetchCopyData = async () => {
      try {
        const response = (await axios.get(API_URL + `/equipment_specs/${copyFromId}`)).data
        form.reset({
          screen_resolution: response?.screen_resolution ?? "",
          processor_type: response?.processor_type ?? "",
          ram_size: response?.ram_size ?? "",
          gpu_info: response?.gpu_info ?? "",
          storage: response?.storage ?? "",
          equipment_id: equipmentId,
        })
      } catch (e) {
        console.log("Ошибка загрузки данных для копирования характеристик оборудования")
        console.log(e)
      }
    }

    fetchCopyData()
  }, [copyFromId, equipmentId, form])

  function AddRowEquipmentSpecsTable(data: z.infer<typeof EquipmentSpecsFormSchema>) {
    setError("")
    setIsProcessing(true)
    axios.post(API_URL + '/equipment_specs/create', data)
      .then(() => {
        window.location.reload()
        toast({
          title: "Характеристики добавлены",
          description: "Данные записаны в БД",
          className: "bg-white"
        })
      })
      .catch((e) => {
        setError("Во время добавления характеристик произошла непредвиденная ошибка")
        console.log("Unexpected error occured while adding row.")
        console.log(e)
        setIsProcessing(false)
      })
  }

  return (
    <CRUDFormForTables
      buttonText="Создать"
      form={form}
      id="addEquipmentSpecsForm"
      onSubmit={AddRowEquipmentSpecsTable}
      error={error}
      isProcessing={isProcessing}
      textFields={textFields}
    />
  )
}

export default EquipmentSpecsAddForm
