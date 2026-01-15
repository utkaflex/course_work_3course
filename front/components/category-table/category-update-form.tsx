"use client"

import {CategoryFormSchema} from "@/schemas"
import {useToast} from "@/hooks/use-toast"
import React, {useEffect, useMemo, useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import axios from "axios"
import {API_URL} from "@/constants"
import {textFields} from "./fields"
import CRUDFormForTables from "../crud-form-for-tables"

type EquipmentType = { id: number; type_name: string }

const CategoryUpdateForm = ({id}: { id: number }) => {
  const [error, setError] = useState<string | undefined>("")
  const [loading, setLoading] = useState<boolean>(true)
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
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [categoryRes, typesRes] = await Promise.all([
          axios.get(API_URL + `/category/${id}`),
          axios.get(API_URL + "/equipment_types/all"),
        ])

        setTypes(typesRes.data)

        const category = categoryRes.data
        form.reset({
          category_name: category.category_name,
          type_ids: (category.types ?? []).map((t: any) => t.id),
        })
      } catch (e) {
        console.log("Ошибка загрузки данных category", e)
      } finally {
        setLoading(false)
        setTypesLoading(false)
      }
    }

    fetchAll()
  }, [id])

  const typeOptions = useMemo(
    () => types.map(t => ({value: t.id, label: t.type_name})),
    [types]
  )

  const UpdateRowCategoryTable = (data: z.infer<typeof CategoryFormSchema>) => {
    setError("")
    setIsProcessing(true)

    axios
      .put(API_URL + `/category/${id}`, data, {
        params: {category_id: id},
      })
      .then(() => {
        localStorage.setItem("last_tab", "category")
        window.location.reload()
        toast({
          title: "Категория обновлена",
          description: "Данные записаны в БД",
          className: "bg-white",
        })
      })
      .catch((e) => {
        if (e.response?.data?.detail === "Category already exists") {
          setError("Такая категория уже существует")
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
      id="updateCategoryForm"
      onSubmit={UpdateRowCategoryTable}
      error={error}
      isProcessing={isProcessing}
      loading={loading}
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

export default CategoryUpdateForm
