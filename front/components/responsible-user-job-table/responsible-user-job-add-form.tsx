"use client"

import {ResponsibleUserJobFormSchema} from '@/schemas';

import React, {useEffect, useState} from 'react'
import * as z from "zod"
import axios from "axios";
import {API_URL} from "@/constants";
import {zodResolver} from "@hookform/resolvers/zod"
import {useToast} from '@/hooks/use-toast';
import {useForm} from 'react-hook-form';
import {textFields} from './fields';
import CRUDFormForTables from '../crud-form-for-tables';

const ResponsibleUserJobAddForm = ({copyFromId}: {copyFromId?: number}) => {
  const [error, setError] = useState<string | undefined>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const {toast} = useToast()

  const form = useForm<z.infer<typeof ResponsibleUserJobFormSchema>>({
    resolver: zodResolver(ResponsibleUserJobFormSchema),
    defaultValues: {
      job_name: ""
    }
  });

  useEffect(() => {
    if (copyFromId === undefined) return

    const fetchCopyData = async () => {
      try {
        const response = await axios.get(API_URL + `/responsible_users/job/${copyFromId}`)
        form.reset({
          job_name: response.data?.job_name ?? ""
        })
      } catch (e) {
        console.log("Ошибка загрузки данных для копирования должности ответственного")
        console.log(e)
      }
    }

    fetchCopyData()
  }, [copyFromId, form])

  function AddRowResponsibleUserJobTable(data: z.infer<typeof ResponsibleUserJobFormSchema>) {
    setError("")
    setIsProcessing(true)
    axios.post(API_URL + '/responsible_users/job/create', data)
      .then(() => {
        localStorage.setItem("last_tab", "responsible_users_jobs")
        window.location.reload()
        toast({
          title: "Должность добавлена",
          description: "Данные записаны в БД",
          className: "bg-white"
        })
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
      id="addResponsibleUserJobForm"
      onSubmit={AddRowResponsibleUserJobTable}
      error={error}
      isProcessing={isProcessing}
      textFields={textFields}
    />
  )
}

export default ResponsibleUserJobAddForm
