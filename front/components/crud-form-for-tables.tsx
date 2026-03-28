import React from 'react'
import {Form} from './ui/form'
import FormTextField from './form-text-field'
import FormComboboxField from './form-combobox-field'
import {FormError} from './form-error'
import {Button} from './ui/button'
import {FieldValues, Path, SubmitHandler, UseFormReturn} from 'react-hook-form'
import {LoadingSpinner} from './loading-spinner'
import FormMultiComboboxField from "@/components/form-multi-combobox-field";

type TextField = {
  name: string
  label: string
  placeholder: string
  type?: React.HTMLInputTypeAttribute
}

type ComboboxField = {
  name: string
  label: string
  value_field: string
  id_field: string
  data: any[]
  frontText: string
  inputPlaceholder: string
  emptyText: string
}

type MultiComboboxField = {
  name: string
  label: string
  id_field: string
  value_field: string
  data: any[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
}

function CRUDFormForTables<TData extends FieldValues, TComboboxData extends FieldValues>({
                                                                                           buttonText,
                                                                                           form,
                                                                                           id,
                                                                                           onSubmit,
                                                                                           error,
                                                                                           loading,
                                                                                           textFields,
                                                                                           comboboxFields,
                                                                                           multiComboboxFields,
                                                                                           isProcessing,
                                                                                           inventoryWarning,
                                                                                           onInventoryBlur,
                                                                                           children
                                                                                         }: {
  buttonText: string
  form: UseFormReturn<TData>
  id: string
  onSubmit: SubmitHandler<TData>
  error: string | undefined
  loading?: boolean | undefined
  textFields?: TextField[]
  comboboxFields?: ComboboxField[]
  multiComboboxFields?: MultiComboboxField[]
  isProcessing?: boolean
  inventoryWarning?: boolean
  onInventoryBlur?: (value: string) => void
  children?: React.ReactNode
}) {
  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <Form {...form}>
      <form id={id}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 overflow-hidden"
      >
        <div className="space-y-4 mx-1">
          {textFields && textFields.map((formItem, index) => {
            const isInventory = formItem.name === "inventory_number"
            return <div key={index}>
              <FormTextField
                control={form.control}
                name={formItem.name as Path<TData>}
                label={formItem.label}
                placeholder={formItem.placeholder}
                type={formItem.type}
                onBlurValue={isInventory ? onInventoryBlur : undefined}
                className={isInventory && inventoryWarning ? "bg-yellow-50 border-yellow-400 focus-visible:ring-yellow-400" : ""}
              />
              {isInventory && inventoryWarning && (
                <p className="mt-1 text-sm text-yellow-700">
                  Оборудование с таким инвентарным номером уже есть в базе
                </p>
              )}
            </div>
          })}

          {comboboxFields && comboboxFields.map((formItem, index) => {
            return <FormComboboxField
              key={index}
              form={form}
              name={formItem.name as Path<TData>}
              label={formItem.label}
              data={formItem.data}
              value_field={formItem.value_field}
              id_field={formItem.id_field}
              frontText={formItem.frontText}
              inputPlaceholder={formItem.inputPlaceholder}
              emptyText={formItem.emptyText}
            />
          })}

          {multiComboboxFields && multiComboboxFields.map((formItem, index) => {
            return (
              <FormMultiComboboxField
                key={index}
                form={form}
                name={formItem.name as Path<TData>}
                label={formItem.label}
                data={formItem.data}
                value_field={formItem.value_field}
                id_field={formItem.id_field}
                placeholder={formItem.placeholder}
                searchPlaceholder={formItem.searchPlaceholder}
                emptyText={formItem.emptyText}
              />
            )
          })}
        </div>
        {children}
        <FormError message={error}/>
        <Button
          disabled={isProcessing}
          type="submit"
          className="w-full bg-blue-3 hover:bg-blue-700"
        >
          {isProcessing && <LoadingSpinner/>}
          {buttonText}
        </Button>
      </form>
    </Form>
  )
}

export default CRUDFormForTables
