export type TextFieldName = "doc_number"
export type ComboboxFieldName = "status_type_id" | "responsible_user_id" | "building_id"

export type DataArray = {
  id: number
  value: string
  color?: string
}

export const textFields = [
  {
    name: "doc_number",
    label: "Номер документа",
    placeholder: "Номер документа для статуса",
  }
]

export const comboboxFields = [
  {
    name: "status_type_id",
    label: "Статус",
    value_field: "value",
    id_field: "id",
    data: [] as DataArray[],
    frontText: "Выберите статус",
    inputPlaceholder: "Введите название...",
    emptyText: "Статусов не найдено"
  },
  {
    name: "responsible_user_id",
    label: "Ответственный",
    value_field: "value",
    id_field: "id",
    data: [] as DataArray[],
    frontText: "Выберите ответственного",
    inputPlaceholder: "Введите имя, должность или подразделение...",
    emptyText: "Ответственных не найдено"
  },
  {
    name: "room_id",
    label: "Помещение",
    value_field: "value",
    id_field: "id",
    data: [] as DataArray[],
    frontText: "Выберите помещение",
    inputPlaceholder: "Поиск помещения...",
    emptyText: "Помещения не найдены",
  },
]
