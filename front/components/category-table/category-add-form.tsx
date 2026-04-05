"use client"

import {CategoryFormSchema} from "@/schemas"
import React, {useEffect, useMemo, useState} from "react"
import * as z from "zod"
import axios from "axios"
import {API_URL} from "@/constants"
import {zodResolver} from "@hookform/resolvers/zod"
import {useToast} from "@/hooks/use-toast"
import {useForm} from "react-hook-form"
import {textFields} from "./fields"
import CRUDFormForTables from "../crud-form-for-tables"

type EquipmentType = { id: number; type_name: string }

const CategoryAddForm = ({copyFromId}: {copyFromId?: number}) => {
  const [error, setError] = useState<string | undefined>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [types, setTypes] = useState<EquipmentType[]>([])
  const [typesLoading, setTypesLoading] = useState(true)

  const {toast} = useToast()

  const form = useForm<z.infer<typeof CategoryFormSchema>>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      category_name: "",
      type_ids: [],
    },
  })

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axios.get(API_URL + "/equipment_types/all")
        setTypes(res.data)
      } catch (e) {
        console.log("Ошибка загрузки типов оборудования", e)
      } finally {
        setTypesLoading(false)
      }
    }
    fetchTypes()
  }, [])

  useEffect(() => {
    if (copyFromId === undefined) return

    const fetchCopyData = async () => {
      try {
        const categoryRes = await axios.get(API_URL + `/category/${copyFromId}`)
        const category = categoryRes.data
        form.reset({
          category_name: category?.category_name ?? "",
          type_ids: Array.isArray(category?.types) ? category.types.map((type: any) => type.id) : [],
        })
      } catch (e) {
        console.log("Ошибка загрузки данных для копирования категории", e)
      }
    }

    fetchCopyData()
  }, [copyFromId, form])

  const typeOptions = useMemo(
    () => types.map(t => ({value: t.id, label: t.type_name})),
    [types]
  )

  function AddRowCategoryTable(data: z.infer<typeof CategoryFormSchema>) {
    setError("")
    setIsProcessing(true)

    axios
      .post(API_URL + "/category/create", data)
      .then(() => {
        localStorage.setItem("last_tab", "category")
        window.location.reload()
        toast({
          title: "Категория добавлена",
          description: "Данные записаны в БД",
          className: "bg-white",
        })
      })
      .catch((e) => {
        if (e.response?.data?.detail === "Category already exists") {
          setError("Такая категория уже существует")
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
      id="addCategoryForm"
      onSubmit={AddRowCategoryTable}
      error={error}
      isProcessing={isProcessing}
      textFields={textFields}
      multiComboboxFields={[
        {
          name: "type_ids",
          label: "Типы оборудования",
          data: types,
          id_field: "id",
          value_field: "type_name",
          placeholder: "Выберите типы оборудования...",
          searchPlaceholder: "Поиск типа...",
          emptyText: "Типы не найдены",
        },
      ]}
    />
  )
}

export default CategoryAddForm
