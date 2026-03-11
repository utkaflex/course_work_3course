import {useToast} from '@/hooks/use-toast';
import axios from 'axios';
import React, {useState} from 'react'
import {useForm} from 'react-hook-form';
import CRUDFormForTables from './crud-form-for-tables';

const DeleteRowForm = ({
                         apiEndpoint,
                         toastText,
                         calledFrom,
                         onSuccess,
                         onClose,
                         onSubmit
                       }: {
  apiEndpoint: string
  toastText: string
  calledFrom?: string
  onSuccess?: () => Promise<void> | void
  onClose?: () => void
  onSubmit?: () => void
}) => {
  const [error, setError] = useState<string | undefined>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const {toast} = useToast()

  const form = useForm();

  function DeleteRowTable() {
    setError("")
    setIsProcessing(true)
    axios.delete(apiEndpoint)
      .then(async () => {
        if (calledFrom) {
          localStorage.setItem("last_tab", calledFrom)
        }

        toast({
          title: toastText,
          description: "Данные удалены из БД",
          className: "bg-white"
        })
        await onSuccess?.()
        onSubmit?.()
        onClose?.()

        if (!onSuccess) {
          window.location.reload()
        }
      })
      .catch((e) => {
        setError("Произошла непредвиденная ошибка при удалении записи")
        console.log("Error while deleting row")
        console.log(e)
        setIsProcessing(false)
      })
  }

  return (
    <CRUDFormForTables
      buttonText="Удалить"
      form={form}
      id="addUserForm"
      onSubmit={DeleteRowTable}
      error={error}
      isProcessing={isProcessing}
    />
  )
}

export default DeleteRowForm
