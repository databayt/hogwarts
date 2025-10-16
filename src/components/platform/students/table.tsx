"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { getStudentColumns, type StudentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { StudentCreateForm } from "@/components/platform/students/form";
import { ExportButton } from "./export-button";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface StudentsTableProps {
  data: StudentRow[];
  pageCount: number;
  dictionary?: Dictionary['school']['students'];
}

export function StudentsTable({ data, pageCount, dictionary }: StudentsTableProps) {
  // Generate columns on the client side with hooks
  const columns = useMemo(() => getStudentColumns(dictionary), [dictionary]);

  const { table } = useDataTable<StudentRow>({ data, columns, pageCount });
  const { openModal } = useModal();
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
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
          <ExportButton />
        </div>
      </DataTableToolbar>
      <Modal content={<StudentCreateForm />} />
    </DataTable>
  );
}



