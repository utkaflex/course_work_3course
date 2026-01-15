"use client"

import {CategoryDataTable} from "./data-table"
import {CategorySchema} from "@/schemas"
import {CategoryTableColumns} from "./columns"
import {useEffect, useState} from "react"
import axios from "axios"
import {API_URL} from "@/constants"
import {z} from "zod"

export default function CategoryTable() {
  const [data, setData] = useState<z.infer<typeof CategorySchema>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/category/all`)
        setData(response.data)
      } catch (error) {
        console.error("Error loading categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading categories...</div>
  }

  return <CategoryDataTable columns={CategoryTableColumns} data={data}/>
}
