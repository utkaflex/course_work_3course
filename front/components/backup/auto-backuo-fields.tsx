import React, { useMemo } from "react";
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"

type WeekdayNum = 0 | 1 | 2 | 3 | 4 | 5 | 6

const weekdayOptions: { value: WeekdayNum; label: string }[] = [
  {value: 0, label: "Пн"},
  {value: 1, label: "Вт"},
  {value: 2, label: "Ср"},
  {value: 3, label: "Чт"},
  {value: 4, label: "Пт"},
  {value: 5, label: "Сб"},
  {value: 6, label: "Вс"},
]

const timezoneOptions: { value: UiSettings["timezone"]; label: string }[] = [
  {value: "Europe/Moscow", label: "МСК"},
  {value: "Asia/Yekaterinburg", label: "ЕКБ"},
]

type UiSettings = {
  time: string
  weekdays: WeekdayNum[]
  timezone: "Europe/Moscow" | "Asia/Yekaterinburg"

  netPath: string
  dir: string
  username: string
  password: string
}

function WeekdayMultiSelect(props: {
  weekdays: WeekdayNum[]
  setWeekdays: React.Dispatch<React.SetStateAction<WeekdayNum[]>>
  disabled?: boolean
}) {
  const {weekdays, setWeekdays, disabled} = props

  const selectedWeekdayLabels = useMemo(() => {
    return weekdayOptions.filter((o) => weekdays.includes(o.value)).map((o) => o.label)
  }, [weekdays])

  const weekdayButtonLabel =
    selectedWeekdayLabels.length === 0 ? "Выберите дни недели..." : selectedWeekdayLabels.join(", ")

  const toggleWeekday = (d: WeekdayNum) => {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  return (
    <div className="flex flex-col gap-1 max-w-md w-full">
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
            disabled={disabled}
          >
            {weekdayButtonLabel}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-full bg-light-3 border-2 border-black shadow rounded-md"
          align="start"
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <Command className="bg-light-3">
            <CommandInput placeholder="Поиск..." className="h-9 " />
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
                      <Check className={cn("ml-auto", isSelected ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function BackupFields(props: {
  time: string
  setTime: React.Dispatch<React.SetStateAction<string>>
  timezone: UiSettings["timezone"]
  setTimezone: React.Dispatch<React.SetStateAction<UiSettings["timezone"]>>
  weekdays: WeekdayNum[]
  setWeekdays: React.Dispatch<React.SetStateAction<WeekdayNum[]>>
  netPath: string
  setNetPath: React.Dispatch<React.SetStateAction<string>>
  dir: string
  setDir: React.Dispatch<React.SetStateAction<string>>
  username: string
  setUsername: React.Dispatch<React.SetStateAction<string>>
  password: string
  setPassword: React.Dispatch<React.SetStateAction<string>>
  isProcessing: boolean
}) {
  const {time, setTime, timezone, setTimezone, weekdays, setWeekdays, netPath, setNetPath, dir, setDir, username, setUsername, password, setPassword, isProcessing} = props

  return (
    <div className="flex flex-col gap-4 max-h-80 flex-wrap content-start">
      <div className="flex flex-col gap-1 max-w-md w-full">
        <div className="text-sm text-muted-foreground">Время бэкапа</div>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border-2 bg-white"
          disabled={isProcessing}
        />
      </div>

      <div className="flex flex-col gap-1 max-w-md w-full">
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

      <WeekdayMultiSelect weekdays={weekdays} setWeekdays={setWeekdays} disabled={isProcessing} />

      <div className="flex flex-col gap-1 max-w-md w-full">
        <div className="text-sm text-muted-foreground">Сетевой путь</div>
        <Input
          value={netPath}
          onChange={(e) => setNetPath(e.target.value)}
          placeholder="\\192.168.0.10\backups"
          className="border-2 bg-white"
          disabled={isProcessing}
          inputMode="numeric"
        />
      </div>

      <div className="flex flex-col gap-1 max-w-md w-full">
        <div className="text-sm text-muted-foreground">Путь до папки</div>
        <Input
          value={dir}
          onChange={(e) => setDir(e.target.value)}
          placeholder="/db/backups"
          className="border-2 bg-white"
          disabled={isProcessing}
        />
      </div>

      <div className="flex flex-col gap-1 max-w-md w-full">
        <div className="text-sm text-muted-foreground">Имя пользователя (domain\username)</div>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="DOMAIN\user"
          className="border-2 bg-white"
          disabled={isProcessing}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <div className="flex flex-col gap-1 max-w-md w-full">
        <div className="text-sm text-muted-foreground">Пароль</div>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='password'
          className="border-2 bg-white"
          disabled={isProcessing}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
    </div>
  )
}

export default BackupFields
