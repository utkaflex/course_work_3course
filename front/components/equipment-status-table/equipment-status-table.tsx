"use client"

import {z} from "zod"
import {EquipmentStatusTableColumns} from "./columns"
import {EquipmentStatusSchema, EquipmentStatusTableSchema, SingleResponsibleUserSchema} from "@/schemas"
import axios from "axios"
import {API_URL} from "@/constants"
import {EquipmentStatusDataTable} from "./data-table"
import {useEffect, useState} from "react"

export default function EquipmentStatusTable({
                                               equipmentId,
                                               statuses,
                                               reload
                                             }: {
  equipmentId: number
  statuses: z.infer<typeof EquipmentStatusSchema>[]
  reload: () => void
}) {
  const [data, setData] = useState<z.infer<typeof EquipmentStatusTableSchema>[]>([])

  const fetchData = async () => {
    try {
      const newData = await Promise.all(statuses.map(async (status) => {
        const statusDetailsPromise = status.remarks === undefined
          ? axios.get(`${API_URL}/equipment_status/${status.id}`)
          : Promise.resolve({data: {remarks: status.remarks}})

        const status_type = (await axios.get(
          `${API_URL}/equipment_status_type/${status.status_type_id}`
        )).data

        const responsible_user = (await axios.get(
          `${API_URL}/responsible_users/${status.responsible_user_id}`
        )).data as z.infer<typeof SingleResponsibleUserSchema>

        const user_fio = [
          responsible_user.last_name,
          responsible_user.first_name,
          responsible_user.paternity
        ].filter(Boolean).join(" ")

        const [user_job, user_office, statusDetailsRes] = await Promise.all([
          axios.get(`${API_URL}/responsible_users/job/${responsible_user.job_id}`),
          axios.get(`${API_URL}/responsible_users/office/${responsible_user.office_id}`),
          statusDetailsPromise,
        ])

        const buildingLabel = status.room?.building.building_address

        const roomLabel = status.room
          ? `${status.room.name} (${status.room.room_type?.room_type ?? ""})`.trim()
          : ""

        return {
          status_type_name: status_type.status_type_name,
          status_type_color: status_type.status_type_color,
          doc_number: status.doc_number,
          status_change_date: status.status_change_date,
          responsible_user_fio: user_fio,
          responsible_user_job_name: user_job.data.job_name,
          responsible_user_office_name: user_office.data.office_name,
          building_address: buildingLabel,
          room_label: roomLabel,
          remarks: statusDetailsRes.data?.remarks ?? "",
          id: status.id,
          equipment_id: status.equipment_id
        } as z.infer<typeof EquipmentStatusTableSchema>
      }))

      newData.sort(
        (a, b) =>
          new Date(b.status_change_date).getTime() -
          new Date(a.status_change_date).getTime()
      );

      setData(newData)
    } catch (error) {
      console.error("Error loading equipment status data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statuses])

  return (
    <EquipmentStatusDataTable
      columns={EquipmentStatusTableColumns}
      data={data}
      equipmentId={equipmentId}
      reload={reload}
    />
  )
}
