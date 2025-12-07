import React, { HTMLInputTypeAttribute } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "./ui/input"
import {cn} from "@/lib/utils";

interface FormTextFieldProps<TSchema extends FieldValues, TTextFieldName> {
    control: Control<TSchema>
    name: TTextFieldName;
    label: string;
    placeholder: string;
    type?: HTMLInputTypeAttribute | undefined;

    onBlurValue?: (value: string) => void
    className?: string
}

function FormTextField<TSchema extends FieldValues, TTextFieldName extends Path<TSchema>>({
    control,
    name,
    label,
    placeholder,
    type = undefined,
    onBlurValue,
    className
}: FormTextFieldProps<TSchema, TTextFieldName>) {
  return (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Input
                        {...field}
                        placeholder={placeholder}
                        type={type}
                        className={cn(className)}
                        onBlur={(e) => {
                          field.onBlur()
                          onBlurValue?.(e.target.value)
                        }}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
  )
}

export default FormTextField
