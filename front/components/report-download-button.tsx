"use client"

import React, {useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Button} from "./ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import {Label} from "./ui/label"
import {Popover, PopoverContent, PopoverTrigger} from "./ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "./ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"
import {API_URL} from "@/constants"

type ReportType = {
  id: number
  report_type_name: string
}

function ReportDownloadButton<TData>({
                                       apiEndpoint,
                                       buttonText = "Сформировать отчёт",
                                       className,
                                       tableData = [],
                                       getId,
                                     }: {
  apiEndpoint: string
  buttonText?: string
  className?: string
  tableData?: TData[]
  getId?: (row: TData) => number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportTypes, setReportTypes] = useState<ReportType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [reportTypeId, setReportTypeId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const ids = useMemo(() => {
    if (!tableData?.length) return []
    if (getId) return tableData.map(getId)
    return (tableData as any[]).map((x) => Number(x.id))
  }, [tableData, getId])

  useEffect(() => {
    if (!isOpen) return

    const fetchTypes = async () => {
      setLoadingTypes(true)
      try {
        const res = await axios.get(API_URL + "/report_types/all")
        setReportTypes(res.data)
      } catch (e) {
        console.log("Ошибка загрузки типов отчётов", e)
      } finally {
        setLoadingTypes(false)
      }
    }

    fetchTypes()
  }, [isOpen])

  const selectedReportType = reportTypes.find((t) => t.id === reportTypeId)

  const handleDownload = async () => {
    try {
      if (!reportTypeId) return

      setIsProcessing(true)
      axios.defaults.withCredentials = true

      const payload = {
        ids,
        report_type_id: reportTypeId,
      }

      const response = await axios.post(apiEndpoint, payload, {
        headers: {"Content-Type": "application/json"},
        responseType: "blob",
      })

      const disposition = response.headers["content-disposition"]
      const filename = disposition
        ? disposition.split("filename=")[1]
        : "report.xlsx"

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setIsOpen(false)
      setReportTypeId(null)
    } catch (error) {
      console.error("Ошибка при формировании отчёта:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        disabled={!ids.length}
      >
        {buttonText}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent
          className="flex-col max-w-2xl bg-light-3 border-2 border-black shadow max-h-full overflow-y-auto">
          <AlertDialogHeader className="flex items-center">
            <AlertDialogTitle>Сформировать отчёт</AlertDialogTitle>
            <AlertDialogDescription>
              Выберите тип отчёта и нажмите <b>Сформировать</b>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label>Тип отчёта</Label>

              {loadingTypes ? (
                <div className="text-sm text-muted-foreground">
                  Загрузка типов отчётов...
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between border-2",
                        !selectedReportType && "text-muted-foreground"
                      )}
                    >
                      {selectedReportType
                        ? selectedReportType.report_type_name
                        : "Выберите тип отчёта..."}
                      <ChevronsUpDown className="opacity-50"/>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="p-0 w-full" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Поиск типа отчёта..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>Типы отчётов не найдены</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__clear__"
                            onSelect={() => setReportTypeId(null)}
                          >
                            Сбросить выбор
                          </CommandItem>

                          {reportTypes.map((t) => {
                            const isSelected = t.id === reportTypeId
                            return (
                              <CommandItem
                                key={t.id}
                                value={t.report_type_name}
                                onSelect={() => setReportTypeId(t.id)}
                              >
                                {t.report_type_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              В отчёт попадёт записей: <b>{ids.length}</b>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              className="w-full border-2"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Назад
            </AlertDialogCancel>

            <AlertDialogAction
              type="button"
              className="w-full bg-blue-3 hover:bg-blue-700"
              onClick={handleDownload}
              disabled={!reportTypeId || isProcessing || loadingTypes}
            >
              {isProcessing ? "Формирование..." : "Сформировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ReportDownloadButton
