"use client"

import {z} from "zod"
import {EquipmentSpecsTableColumns} from "./columns"
import {EquipmentSpecsSchema} from "@/schemas"
import {EquipmentSpecsDataTable} from "./data-table"
import {useEffect, useState} from "react"

export default function EquipmentSpecsTable({
                                              equipmentId,
                                              specs,
                                            }: {
  equipmentId: number
  specs: z.infer<typeof EquipmentSpecsSchema>[]
}) {
  const [data, setData] = useState<z.infer<typeof EquipmentSpecsSchema>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(specs ?? [])
    setLoading(false)
  }, [equipmentId, specs])

  if (loading) return <div>Loading...</div>

  return (
    <EquipmentSpecsDataTable
      columns={EquipmentSpecsTableColumns}
      data={data}
      equipmentId={equipmentId}
    />
  )
}
