"use client"

import {RoomDataTable} from "./data-table"
import {RoomSchema} from "@/schemas"
import {RoomTableColumns} from "./columns"
import {useEffect, useState} from "react"
import axios from "axios"
import {API_URL} from "@/constants"
import {z} from "zod"

export default function RoomTable() {
  const [data, setData] = useState<z.infer<typeof RoomSchema>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/room/all`)
        setData(response.data)
      } catch (error) {
        console.error("Error loading rooms:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading rooms...</div>

  return <RoomDataTable columns={RoomTableColumns} data={data}/>
}
