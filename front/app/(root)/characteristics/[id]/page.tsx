"use client"

import DownloadButton from "@/components/download-button";
import EquipmentSpecsTable from "@/components/equipment-specs-table/equipment-specs-table";
import EquipmentStatusTable from "@/components/equipment-status-table/equipment-status-table";
import EquipmentTable from "@/components/equipment-table/equipment-table";
import EquipmentUpdateForm from "@/components/equipment-table/equipment-update-form";
import Action from "@/components/action";
import {Button} from "@/components/ui/button";
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
  const [isUpdateEquipmentOpen, setIsUpdateEquipmentOpen] = useState(false)
  const [refreshTablesToken, setRefreshTablesToken] = useState(0)

  const fetchEquipment = async () => {
    try {
      axios.defaults.withCredentials = true
      const res = await axios.get(`${API_URL}/equipment/${id}`)
      setEquipment(res.data)
    } catch (e) {
      console.error("Ошибка загрузки оборудования:", e)
    }
  }

  useEffect(() => {
    fetchEquipment()
  }, [id])

  return (
    <section
      className="flex size-full flex-col gap-5
      bg-light-3 p-6 rounded-[14px] border shadow-sm max-sm:w-screen"
    >
      <Action
        title="Изменить оборудование"
        description={<>Заполните все поля и нажмите кнопку <b>Изменить</b></>}
        form={<EquipmentUpdateForm
          id={id}
          onSuccess={async () => {
            await fetchEquipment()
            setRefreshTablesToken((prev) => prev + 1)
          }}
          onClose={() => setIsUpdateEquipmentOpen(false)}
        />}
        isOpen={isUpdateEquipmentOpen}
        setIsOpen={setIsUpdateEquipmentOpen}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Оборудование</CardTitle>
            <div className="flex items-center gap-2">
              {userRole >= 3 && (
                <Button
                  className="bg-blue-2 hover:bg-blue-700"
                  onClick={() => setIsUpdateEquipmentOpen(true)}
                >
                  Изменить оборудование
                </Button>
              )}
              <DownloadButton
                apiEndpoint={API_URL + `/equipment/to_word/${id}`}
                buttonText="Карточка оборудования"
                className="bg-blue-2 hover:bg-blue-700"
              />
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-gray-300"/>
        <CardContent className="space-y-2 py-4">
          <EquipmentTable variant="main" showFilters={false} equipmentId={id} userRole={userRole} refreshToken={refreshTablesToken}/>
          <EquipmentTable variant="other" showFilters={false} equipmentId={id} userRole={userRole} refreshToken={refreshTablesToken}/>
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
          <EquipmentStatusTable
            equipmentId={id}
            statuses={equipment?.statuses ?? []}
            reload = {fetchEquipment}
          />
        </CardContent>
      </Card>
    </section>
  )
};

export default EquipmentStatusPage;
