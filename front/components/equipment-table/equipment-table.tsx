'use client'

import {z} from "zod"
import {EquipmentTableColumns} from "./columns"
import {EquipmentSchema} from "@/schemas"
import axios from "axios"
import {API_URL} from "@/constants"
import {EquipmentDataTable} from "./data-table"
import {useEffect, useState} from "react"

export default function EquipmentTable({
                                         variant,
                                         showFilters,
                                         equipmentId,
                                         userRole
                                       }: {
  variant: 'main' | 'other',
  showFilters: boolean,
  equipmentId?: number,
  userRole: number
}) {
  const [data, setData] = useState<z.infer<typeof EquipmentSchema>[]>([])

  const fetchData = async () => {
    try {
      axios.defaults.withCredentials = true
      let response = []
      if (equipmentId) {
        const equipment = (await axios.get(`${API_URL}/equipment/${equipmentId}`)).data
        const type = (await axios.get(`${API_URL}/equipment_types/${equipment.type_id}`)).data.type_name
        response = [{...equipment, type_name: type}]
      } else {
        response = (await axios.get(`${API_URL}/equipment/all`)).data
      }

      setData(response)
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [equipmentId])

  return <EquipmentDataTable columns={EquipmentTableColumns} data={data} variant={variant} showFilters={showFilters}
                             userRole={userRole} reload={fetchData} />
}
