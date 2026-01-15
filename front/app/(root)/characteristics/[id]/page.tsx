"use client"

import DownloadButton from "@/components/download-button";
import EquipmentSpecsTable from "@/components/equipment-specs-table/equipment-specs-table";
import EquipmentStatusTable from "@/components/equipment-status-table/equipment-status-table";
import EquipmentTable from "@/components/equipment-table/equipment-table";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {API_URL} from "@/constants";
import React, {useEffect, useState} from "react";
import {useUser} from "@/hooks/use-user";
import axios from "axios";
import {EquipmentExtendedSchema} from "@/schemas";
import {z} from "zod";

const EquipmentStatusPage = (props: { params: Promise<{ id: string }> }) => {
  const {userRole} = useUser();
  const id = Number(React.use(props.params).id)

  const [equipment, setEquipment] = useState<z.infer<typeof EquipmentExtendedSchema> | null>(null)
  const [loadingEquipment, setLoadingEquipment] = useState(true)

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoadingEquipment(true)
        axios.defaults.withCredentials = true
        const res = await axios.get(`${API_URL}/equipment/${id}`)
        setEquipment(res.data)
      } catch (e) {
        console.error("Ошибка загрузки оборудования:", e)
      } finally {
        setLoadingEquipment(false)
      }
    }

    fetchEquipment()
  }, [id])

  return (
    <section
      className="flex size-full flex-col gap-5
      bg-light-3 p-6 rounded-[14px] border shadow-sm max-sm:w-screen"
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Оборудование</CardTitle>
            <DownloadButton
              apiEndpoint={API_URL + `/equipment/to_word/${id}`}
              buttonText="Карточка оборудования"
              className="bg-blue-2 hover:bg-blue-700"
            />
          </div>
        </CardHeader>
        <Separator className="bg-gray-300"/>
        <CardContent className="space-y-2 py-4">
          <EquipmentTable variant="main" showFilters={false} equipmentId={id} userRole={userRole}/>
          <EquipmentTable variant="other" showFilters={false} equipmentId={id} userRole={userRole}/>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Характеристики</CardTitle>
        </CardHeader>
        <Separator className="bg-gray-300"/>
        <CardContent className="space-y-2">
          <EquipmentSpecsTable
            equipmentId={id}
            specs={equipment?.specifications ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История статусов</CardTitle>
        </CardHeader>
        <Separator className="bg-gray-300"/>
        <CardContent className="space-y-2">
          {loadingEquipment ? (
            <div>Loading...</div>
          ) : (
            <EquipmentStatusTable
              equipmentId={id}
              statuses={equipment?.statuses ?? []}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
};

export default EquipmentStatusPage;
