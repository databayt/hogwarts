"use client";

/**
 * All logs view component with filtering
 */

import { useState } from "react";
import { LogCard } from "./card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileText } from "lucide-react";
import type { UnifiedLog } from "./type";
import { LOG_LEVELS } from "./constant";
import { sortLogs, exportLogsToCSV } from "./util";

interface AllLogsProps {
  logs: UnifiedLog[];
  showFilters?: boolean;
  onExport?: () => void;
}

export function AllLogs({ logs, showFilters = true, onExport }: AllLogsProps) {
  const [filters, setFilters] = useState({
    search: "",
    level: "",
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredLogs = logs.filter((log) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !log.action.toLowerCase().includes(search) &&
        !(log.userEmail || "").toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    if (filters.level && log.level !== filters.level) {
      return false;
    }
    return true;
  });

  const sortedLogs = sortLogs(filteredLogs, "createdAt", sortDirection);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      const csv = exportLogsToCSV(sortedLogs);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3>All Logs</h3>
          <span className="rounded-full bg-muted px-2 py-1">
            <small>{sortedLogs.length}</small>
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>

      {showFilters && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>

          <Select value={filters.level} onValueChange={(value) => setFilters({ ...filters, level: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All levels</SelectItem>
              {LOG_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {sortedLogs.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <FileText className="size-10 text-muted-foreground" />
          </div>
          <h4 className="mt-4">No logs found</h4>
          <p className="muted mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLogs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
