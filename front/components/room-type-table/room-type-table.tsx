"use client"

import {RoomTypeDataTable} from "./data-table"
import {RoomTypeSchema} from "@/schemas"
import {RoomTypeTableColumns} from "./columns"
import {useEffect, useState} from "react"
import axios from "axios"
import {API_URL} from "@/constants"
import {z} from "zod"

export default function RoomTypeTable() {
  const [data, setData] = useState<z.infer<typeof RoomTypeSchema>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/room_type/all`)
        setData(response.data)
      } catch (error) {
        console.error("Error loading room types:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading room types...</div>
  }

  return <RoomTypeDataTable columns={RoomTypeTableColumns} data={data}/>
}
