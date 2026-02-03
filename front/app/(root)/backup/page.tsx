"use client"

import React, {useEffect, useState} from 'react'
import ManualBackup from "@/components/backup/manual-backup";
import AutoBackup from "@/components/backup/auto-backup";
import {useUser} from "@/hooks/use-user";
import {Skeleton} from "@/components/ui/skeleton";
import TabsShower from "@/components/tabs-shower";

const tabs = [
  {
    value: "backup",
    tab_text: "Ручной бэкап",
    description: "Здесь вы можете загрузить более старую версию БД",
    children: <ManualBackup/>,
    min_needed_role: 4
  },
  {
    value: "backup_auto",
    tab_text: "Автоматический бэкап",
    description: "Здесь вы можете настроить автоматические бэкапы БД",
    children: <AutoBackup/>,
    min_needed_role: 4
  }
]

const Backup = () => {
  const {userRole, isLoadingUser} = useUser()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lastTab, setLastTab] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setLastTab(localStorage.getItem("last_tab"))
    localStorage.removeItem("last_tab")
    setIsLoading(false)
  }, [])

  if (isLoading || isLoadingUser) return <Skeleton className="flex size-full"/>

  return (
    <section
      className='flex flex-col gap-5 bg-light-3 pt-6 pb-6
            rounded-[14px] border border-gray-300 shadow'
    >
      <TabsShower tabs={tabs} userRole={userRole} startTab={lastTab}/>
    </section>
  )
}

export default Backup
