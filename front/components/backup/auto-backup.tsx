"use client"

import React, {useEffect, useState} from "react"
import axios from "axios"
import {API_URL} from "@/constants"
import {Button} from "@/components/ui/button"
import {useToast} from "@/hooks/use-toast"
import BackupFields from "@/components/backup/auto-backuo-fields";

type WeekdayNum = 0 | 1 | 2 | 3 | 4 | 5 | 6

type ApiAutoBackup = {
  cron: string
  timezone: "Europe/Moscow" | "Asia/Yekaterinburg"
  enabled: boolean

  netPath?: string | null
  dir?: string | null

  last_backup_at?: string | null
  next_backup_at?: string | null
}

type SaveAutoBackupPayload = Pick<ApiAutoBackup, "cron" | "timezone" | "enabled" | "netPath" | "dir"> & {
  username?: string
  password?: string
}

type UiSettings = {
  time: string // "HH:MM"
  weekdays: WeekdayNum[]
  timezone: "Europe/Moscow" | "Asia/Yekaterinburg"
  enabled: boolean

  netPath: string
  dir: string
  username: string
  password: string
}

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

  if (dowRaw === "*") {
    return {time, weekdays: [0, 1, 2, 3, 4, 5, 6]}
  }

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

    const normalized = nums.filter((x): x is WeekdayNum => x >= 0 && x <= 6)
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

  const [time, setTime] = useState<UiSettings["time"]>("09:00")
  const [weekdays, setWeekdays] = useState<UiSettings["weekdays"]>([])
  const [timezone, setTimezone] = useState<UiSettings["timezone"]>("Europe/Moscow")
  const [enabled, setEnabled] = useState<UiSettings["enabled"]>(true)
  const [netPath, setNetPath] = useState<UiSettings["netPath"]>("")
  const [dir, setDir] = useState<UiSettings["dir"]>("")
  const [username, setUsername] = useState<UiSettings["username"]>("")
  const [password, setPassword] = useState<UiSettings["password"]>("")

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

        const tz =
          res.data.timezone === "Asia/Yekaterinburg" ? "Asia/Yekaterinburg" : "Europe/Moscow"
        setTimezone(tz)

        setEnabled(true)

        setNetPath(res.data.netPath ?? "")
        setDir(res.data.dir ?? "")
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
  }, [toast])

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

    const netPathTrim = netPath.trim()
    const dirTrim = dir.trim()
    const usernameTrim = username.trim()
    const passwordTrim = password

    if (!netPathTrim) {
      toast({title: "Ошибка", description: "Укажите IP", className: "bg-white"})
      return
    }
    if (!/^[^/]+\\[^/]+$/.test(usernameTrim)) {
      toast({
        title: "Ошибка",
        description: "Username должен быть в формате domain\\username",
        className: "bg-white",
      })
      return
    }
    if (!passwordTrim) {
      toast({title: "Ошибка", description: "Укажите Password", className: "bg-white"})
      return
    }

    try {
      setIsProcessing(true)
      axios.defaults.withCredentials = true

      const cron = buildCron(time, weekdays)

      const payload: SaveAutoBackupPayload = {
        cron,
        timezone,
        enabled,
        netPath: netPathTrim,
        dir: dirTrim,
        username: usernameTrim,
        password: passwordTrim,
      }

      await axios.post(API_URL + "/backup/auto", payload)

      setServerSettings((prev) => ({
        ...(prev ?? ({} as ApiAutoBackup)),
        cron,
        timezone,
        enabled,
        netPath: netPathTrim,
        dir: dirTrim,
      }))

      toast({
        title: "Настройки автобэкапа сохранены",
        className: "bg-white",
      })
    } catch (e) {
      console.log("Ошибка сохранения автобэкакапа", e)
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

    const tz =
      serverSettings.timezone === "Asia/Yekaterinburg" ? "Asia/Yekaterinburg" : "Europe/Moscow"
    setTimezone(tz)

    setEnabled(true)

    setNetPath(serverSettings.netPath ?? "")
    setDir(serverSettings.dir ?? "")

    setUsername("")
    setPassword("")
  }

  if (isLoading) return <div className="mt-4">Загрузка...</div>

  return (
    <div className="mt-4">
      <BackupFields
        time={time}
        setTime={setTime}
        timezone={timezone}
        setTimezone={setTimezone}
        weekdays={weekdays}
        setWeekdays={setWeekdays}
        netPath={netPath}
        setNetPath={setNetPath}
        dir={dir}
        setDir={setDir}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        isProcessing={isProcessing}
      />

      <div className="flex gap-2 mt-4">
        <Button
          className="bg-blue-2 hover:bg-blue-700"
          onClick={saveSettings}
          disabled={
            !time ||
            !weekdays.length ||
            !netPath.trim() ||
            !dir.trim() ||
            isProcessing
          }
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
