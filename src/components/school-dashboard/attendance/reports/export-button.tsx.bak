"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAttendanceReportCsv } from "@/components/platform/attendance/actions";
import { generateCSVFilename } from "@/lib/csv-export";

type Filters = { classId?: string; studentId?: string; status?: string; from?: string; to?: string };

export function AttendanceReportExportButton({ filters }: { filters: Filters }) {
  const [downloading, setDownloading] = React.useState(false);
  const onDownload = async () => {
    setDownloading(true);
    try {
      const csv = await getAttendanceReportCsv(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateCSVFilename("attendance-report");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Button size="sm" variant="outline" onClick={onDownload} disabled={downloading}>
      <Download className="mr-2 h-4 w-4" />
      {downloading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}


