import "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    reload?: () => Promise<void> | void
  }
}