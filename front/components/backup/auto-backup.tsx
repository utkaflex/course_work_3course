"use client"

import React, {useEffect, useMemo, useState} from "react"
import axios from "axios"
import {API_URL} from "@/constants"
import {Button} from "@/components/ui/button"
import {useToast} from "@/hooks/use-toast"
import {Input} from "@/components/ui/input"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"

// 1..7: Mon..Sun
type WeekdayNum = 0 | 1 | 2 | 3 | 4 | 5 | 6

type ApiAutoBackup = {
  cron: string
  timezone: "Europe/Moscow" | "Asia/Yekaterinburg" | string
  enabled: boolean
  last_backup_at?: string | null
  next_backup_at?: string | null
}

type UiSettings = {
  time: string // "HH:MM"
  weekdays: WeekdayNum[]
  timezone: "Europe/Moscow" | "Asia/Yekaterinburg"
  enabled: boolean
}

const weekdayOptions: { value: WeekdayNum; label: string }[] = [
  {value: 0, label: "Пн"},
  {value: 1, label: "Вт"},
  {value: 2, label: "Ср"},
  {value: 3, label: "Чт"},
  {value: 4, label: "Пт"},
  {value: 5, label: "Сб"},
  {value: 6, label: "Вс"},
]

const timezoneOptions: { value: "Europe/Moscow" | "Asia/Yekaterinburg"; label: string }[] = [
  {value: "Europe/Moscow", label: "МСК"},
  {value: "Asia/Yekaterinburg", label: "ЕКБ"},
]

function parseCron(cron: string): { time: string; weekdays: WeekdayNum[] } {
  const fallback = {time: "09:00", weekdays: [] as WeekdayNum[]}
  if (!cron || typeof cron !== "string") return fallback

  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return fallback

  const [minRaw, hourRaw, , , dowRaw] = parts

  const min = Number(minRaw)
  const hour = Number(hourRaw)

  const hh = Number.isFinite(hour) ? String(hour).padStart(2, "0") : "09"
  const mm = Number.isFinite(min) ? String(min).padStart(2, "0") : "00"

  const time = `${hh}:${mm}`

  const expandRange = (token: string): number[] => {
    const t = token.trim()
    if (!t) return []
    if (t.includes("-")) {
      const [a, b] = t.split("-").map((x) => Number(x))
      if (!Number.isFinite(a) || !Number.isFinite(b)) return []
      const from = Math.min(a, b)
      const to = Math.max(a, b)
      const out: number[] = []
      for (let i = from; i <= to; i++) out.push(i)
      return out
    }
    const n = Number(t)
    return Number.isFinite(n) ? [n] : []
  }

  let weekdays: WeekdayNum[] = []
  if (dowRaw && dowRaw !== "*") {
    const tokens = dowRaw.split(",")
    const nums = tokens.flatMap(expandRange)
    const normalized = nums
      .filter((x): x is WeekdayNum => x !== null)

    weekdays = Array.from(new Set(normalized)).sort((a, b) => a - b)
  }

  return {time, weekdays}
}

function buildCron(time: string, weekdays: WeekdayNum[]): string {
  const [hhRaw, mmRaw] = (time || "").split(":")
  const hh = Number(hhRaw)
  const mm = Number(mmRaw)

  const hour = Number.isFinite(hh) ? hh : 9
  const min = Number.isFinite(mm) ? mm : 0

  const days = Array.from(new Set(weekdays)).sort((a, b) => a - b)

  const dow = days.length === 7 ? "*" : days.join(",")

  return `${min} ${hour} * * ${dow}`
}

const AutoBackup = () => {
  const {toast} = useToast()

  const [serverSettings, setServerSettings] = useState<ApiAutoBackup | null>(null)

  const [time, setTime] = useState<string>("09:00")
  const [weekdays, setWeekdays] = useState<WeekdayNum[]>([])
  const [timezone, setTimezone] = useState<UiSettings["timezone"]>("Europe/Moscow")
  const [enabled, setEnabled] = useState<boolean>(true)

  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        axios.defaults.withCredentials = true
        const res = await axios.get<ApiAutoBackup>(API_URL + "/backup/auto")

        setServerSettings(res.data)

        const parsed = parseCron(res.data.cron)
        setTime(parsed.time)
        setWeekdays(parsed.weekdays)

        const tz = res.data.timezone === "Asia/Yekaterinburg" ? "Asia/Yekaterinburg" : "Europe/Moscow"
        setTimezone(tz)

        setEnabled(Boolean(res.data.enabled))
      } catch (e) {
        console.log("Ошибка загрузки настроек автобэкапа", e)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки автобэкапа",
          className: "bg-white",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const selectedWeekdayLabels = useMemo(() => {
    return weekdayOptions
      .filter((o) => weekdays.includes(o.value))
      .map((o) => o.label)
  }, [weekdays])

  const weekdayButtonLabel =
    selectedWeekdayLabels.length === 0
      ? "Выберите дни недели..."
      : selectedWeekdayLabels.join(", ")

  const toggleWeekday = (d: WeekdayNum) => {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  const saveSettings = async () => {
    if (!time) return
    if (!weekdays.length) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы один день недели",
        className: "bg-white",
      })
      return
    }

    try {
      setIsProcessing(true)
      axios.defaults.withCredentials = true

      const cron = buildCron(time, weekdays)

      const payload: Pick<ApiAutoBackup, "cron" | "timezone" | "enabled"> = {
        cron,
        timezone,
        enabled,
      }

      await axios.post(API_URL + "/backup/auto", payload)

      setServerSettings((prev) => ({
        ...(prev ?? {}),
        cron,
        timezone,
        enabled,
      }))

      toast({
        title: "Настройки автобэкапа сохранены",
        className: "bg-white",
      })
    } catch (e) {
      console.log("Ошибка сохранения автобэкапа", e)
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки автобэкапа",
        className: "bg-white",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const rollback = () => {
    if (!serverSettings) return

    const parsed = parseCron(serverSettings.cron)
    setTime(parsed.time)
    setWeekdays(parsed.weekdays)

    const tz = serverSettings.timezone === "Asia/Yekaterinburg" ? "Asia/Yekaterinburg" : "Europe/Moscow"
    setTimezone(tz)

    setEnabled(Boolean(serverSettings.enabled))
  }

  if (isLoading) return <div className="mt-4">Загрузка...</div>

  return (
    <div className="mt-4 flex flex-col gap-4 max-w-md">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Автобэкап</div>
        <Button
          variant={enabled ? "default" : "outline"}
          className={cn(enabled ? "bg-blue-2 hover:bg-blue-700" : "border-2")}
          onClick={() => setEnabled((v) => !v)}
          disabled={isProcessing}
        >
          {enabled ? "Включен" : "Выключен"}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-muted-foreground">Время бэкапа</div>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border-2 bg-white"
          disabled={isProcessing}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-muted-foreground">Часовой пояс</div>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value as UiSettings["timezone"])}
          className="h-10 w-full rounded-md border-2 bg-white px-3 cursor-pointer text-sm hover:bg-accent"
          disabled={isProcessing}
        >
          {timezoneOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-muted-foreground">Дни недели</div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between border-2 bg-white",
                weekdays.length === 0 && "text-muted-foreground"
              )}
              disabled={isProcessing}
            >
              {weekdayButtonLabel}
              <ChevronsUpDown className="opacity-50"/>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="p-0 w-full bg-light-3 border-2 border-black shadow rounded-md"
            align="start"
            onWheelCapture={(e) => e.stopPropagation()}
          >
            <Command className="bg-light-3">
              <CommandInput placeholder="Поиск..." className="h-9 "/>
              <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
                <CommandEmpty className="py-3 text-center text-sm">Ничего не найдено</CommandEmpty>

                <CommandGroup className="p-1">
                  <CommandItem value="__clear__" onSelect={() => setWeekdays([])}>
                    Сбросить выбор
                  </CommandItem>

                  {weekdayOptions.map((opt, idx) => {
                    const isSelected = weekdays.includes(opt.value)
                    return (
                      <CommandItem
                        key={`${opt.value}-${idx}`}
                        value={opt.label}
                        onSelect={() => toggleWeekday(opt.value)}
                      >
                        {opt.label}
                        <Check className={cn("ml-auto", isSelected ? "opacity-100" : "opacity-0")}/>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <Button
          className="bg-blue-2 hover:bg-blue-700"
          onClick={saveSettings}
          disabled={!time || !weekdays.length || isProcessing}
        >
          {isProcessing ? "Сохранение..." : "Сохранить"}
        </Button>

        <Button
          variant="outline"
          className="border-2"
          onClick={rollback}
          disabled={!serverSettings || isProcessing}
        >
          Сбросить
        </Button>
      </div>
    </div>
  )
}

export default AutoBackup
