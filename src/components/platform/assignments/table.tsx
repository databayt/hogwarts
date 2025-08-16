"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { AssignmentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { AssignmentCreateForm } from "@/components/platform/assignments/form";

export function AssignmentsTable({ data, columns, pageCount }: { data: AssignmentRow[]; columns: ColumnDef<AssignmentRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<AssignmentRow>({ data, columns, pageCount });
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
      <Modal content={<AssignmentCreateForm />} />
    </DataTable>
  );
}
