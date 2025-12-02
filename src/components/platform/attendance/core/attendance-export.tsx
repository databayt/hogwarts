"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DateRangePicker } from '@/components/ui/date-picker';
import { toast } from '@/components/ui/use-toast';
import { Download, FileText, Table2, FileJson, LoaderCircle, Calendar, Users, ListFilter } from "lucide-react";
import type { AttendanceRecord, ExportOptions, AttendanceFilters } from '../shared/types';
import { generateAttendanceCSV, downloadCSV, formatAttendanceDate } from '../shared/utils';

interface AttendanceExportProps {
  records: AttendanceRecord[];
  filters?: AttendanceFilters;
  className?: string;
  dictionary?: any;
}

type ExportFormat = 'CSV' | 'EXCEL' | 'PDF' | 'JSON';
type GroupByOption = 'student' | 'class' | 'date' | 'method' | 'none';

export function AttendanceExport({
  records,
  filters,
  className,
  dictionary
}: AttendanceExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('CSV');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [includeStats, setIncludeStats] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: filters?.dateFrom ? (typeof filters.dateFrom === 'string' ? new Date(filters.dateFrom) : filters.dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30)),
    to: filters?.dateTo ? (typeof filters.dateTo === 'string' ? new Date(filters.dateTo) : filters.dateTo) : new Date()
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'HOLIDAY'
  ]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([
    'MANUAL', 'GEOFENCE', 'QR_CODE', 'BARCODE', 'RFID',
    'FINGERPRINT', 'FACE_RECOGNITION', 'NFC', 'BLUETOOTH', 'BULK_UPLOAD'
  ]);

  const handleExport = async () => {
    setExporting(true);

    try {
      // ListFilter records based on selected criteria
      let filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const isInDateRange = recordDate >= dateRange.from && recordDate <= dateRange.to;
        const hasSelectedStatus = selectedStatuses.includes(record.status);
        const hasSelectedMethod = selectedMethods.includes(record.method);

        return isInDateRange && hasSelectedStatus && hasSelectedMethod;
      });

      // Group records if requested
      if (groupBy !== 'none') {
        filteredRecords = groupRecords(filteredRecords, groupBy);
      }

      // Export based on format
      switch (exportFormat) {
        case 'CSV':
          exportAsCSV(filteredRecords);
          break;
        case 'EXCEL':
          await exportAsExcel(filteredRecords);
          break;
        case 'PDF':
          await exportAsPDF(filteredRecords);
          break;
        case 'JSON':
          exportAsJSON(filteredRecords);
          break;
      }

      toast({
        title: "Export Successful",
        description: `Attendance data exported as ${exportFormat}`
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data"
      });
    } finally {
      setExporting(false);
    }
  };

  const groupRecords = (records: AttendanceRecord[], groupBy: GroupByOption): AttendanceRecord[] => {
    // Implementation would group records based on the groupBy parameter
    // For now, return records as-is
    return records;
  };

  const exportAsCSV = (records: AttendanceRecord[]) => {
    const csv = generateAttendanceCSV(records);
    const filename = `attendance_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    downloadCSV(filename, csv);
  };

  const exportAsExcel = async (records: AttendanceRecord[]) => {
    // This would typically use a library like xlsx or exceljs
    // For now, we'll export as CSV with .xlsx extension
    const csv = generateAttendanceCSV(records);
    const filename = `attendance_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;

    // In production, you'd convert CSV to actual Excel format
    toast({
      title: "Note",
      description: "Excel export is currently in CSV format. Open with Excel to convert.",
    });

    downloadCSV(filename, csv);
  };

  const exportAsPDF = async (records: AttendanceRecord[]) => {
    // This would typically use a library like jsPDF or react-pdf
    // For now, we'll show a message
    toast({
      title: "PDF Export",
      description: "PDF export will be available soon. Please use CSV format for now."
    });
  };

  const exportAsJSON = (records: AttendanceRecord[]) => {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `attendance_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleMethod = (method: string) => {
    setSelectedMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Attendance Data</DialogTitle>
          <DialogDescription>
            Configure export options and download attendance records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CSV" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer flex items-center">
                    <Table2 className="h-4 w-4 mr-1" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EXCEL" id="excel" />
                  <Label htmlFor="excel" className="cursor-pointer flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Excel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PDF" id="pdf" />
                  <Label htmlFor="pdf" className="cursor-pointer flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="JSON" id="json" />
                  <Label htmlFor="json" className="cursor-pointer flex items-center">
                    <FileJson className="h-4 w-4 mr-1" />
                    JSON
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={(range) => setDateRange({ from: range.from || new Date(), to: range.to || new Date() })}
              placeholder="Select date range"
            />
          </div>

          {/* Status ListFilter */}
          <div className="space-y-2">
            <Label>Include Status Types</Label>
            <div className="grid grid-cols-3 gap-2">
              {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'HOLIDAY'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Label
                    htmlFor={status}
                    className="text-sm cursor-pointer"
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Method ListFilter */}
          <div className="space-y-2">
            <Label>Include Tracking Methods</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'MANUAL', label: 'Manual' },
                { value: 'GEOFENCE', label: 'Geofence' },
                { value: 'QR_CODE', label: 'QR Code' },
                { value: 'BARCODE', label: 'Barcode' },
                { value: 'RFID', label: 'RFID' },
                { value: 'FINGERPRINT', label: 'Fingerprint' },
                { value: 'FACE_RECOGNITION', label: 'Face' },
                { value: 'NFC', label: 'NFC' },
                { value: 'BLUETOOTH', label: 'Bluetooth' },
                { value: 'BULK_UPLOAD', label: 'Bulk Upload' }
              ].map(method => (
                <div key={method.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.value}
                    checked={selectedMethods.includes(method.value)}
                    onCheckedChange={() => toggleMethod(method.value)}
                  />
                  <Label
                    htmlFor={method.value}
                    className="text-sm cursor-pointer"
                  >
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Group By Option */}
          <div className="space-y-2">
            <Label>Group By</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="student">By Student</SelectItem>
                <SelectItem value="class">By Class</SelectItem>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="method">By Method</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-stats"
                checked={includeStats}
                onCheckedChange={(checked) => setIncludeStats(checked as boolean)}
              />
              <Label htmlFor="include-stats" className="cursor-pointer">
                Include summary statistics
              </Label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-4 bg-secondary rounded-lg">
            <div className="text-sm space-y-1">
              <p className="font-medium">Export Preview:</p>
              <p className="text-muted-foreground">
                • Format: {exportFormat}
              </p>
              <p className="text-muted-foreground">
                • Date Range: {formatAttendanceDate(dateRange.from)} to {formatAttendanceDate(dateRange.to)}
              </p>
              <p className="text-muted-foreground">
                • Records to export: {records.length}
              </p>
              <p className="text-muted-foreground">
                • Grouping: {groupBy === 'none' ? 'None' : `By ${groupBy}`}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || records.length === 0}
          >
            {exporting ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}