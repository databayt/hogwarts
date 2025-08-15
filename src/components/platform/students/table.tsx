"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { StudentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { StudentCreateForm } from "@/components/platform/students/form";

export function StudentsTable({ data, columns, pageCount }: { data: StudentRow[]; columns: ColumnDef<StudentRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<StudentRow>({ data, columns, pageCount });
  const { openModal } = useModal();
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => openModal()}
          aria-label="Create"
          title="Create"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DataTableToolbar>
      <Modal content={<StudentCreateForm />} />
    </DataTable>
  );
}



