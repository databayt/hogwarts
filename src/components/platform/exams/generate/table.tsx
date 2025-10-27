"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { templateColumns, type ExamTemplateRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ExamTemplateForm } from "./form";

interface TemplatesTableProps {
  initialData: ExamTemplateRow[];
  total: number;
}

export function TemplatesTable({ initialData, total }: TemplatesTableProps) {
  const columns = useMemo(() => templateColumns, []);

  const { table } = useDataTable<ExamTemplateRow>({
    data: initialData,
    columns,
    pageCount: Math.ceil(total / initialData.length) || 1,
  });

  const { openModal } = useModal();

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={() => openModal()}
            aria-label="Create Template"
            title="Create Template"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Template</span>
          </Button>
        </div>
      </DataTableToolbar>
      <Modal content={<ExamTemplateForm />} />
    </DataTable>
  );
}
