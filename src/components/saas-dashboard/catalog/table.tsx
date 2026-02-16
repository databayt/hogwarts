"use client"

import { useMemo } from "react"

import { DataTable } from "@/components/table/data-table"

import { catalogColumns, type CatalogSubjectRow } from "./columns"

interface Props {
  data: CatalogSubjectRow[]
}

export function CatalogTable({ data }: Props) {
  const columns = useMemo(() => catalogColumns, [])

  return <DataTable columns={columns} data={data} searchKey="name" />
}
