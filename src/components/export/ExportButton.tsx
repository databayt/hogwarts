'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  convertToCSV,
  convertToExcel,
  downloadFile,
  formatFilename,
  getLocalizedHeaders,
  processDataForExport
} from './export-utils';
import { SuccessToast } from '@/components/atom/toast';
import { useDictionary } from '@/components/internationalization/use-dictionary';

export type ExportFormat = 'csv' | 'excel';

export interface ExportButtonProps {
  /** Function to fetch data for export */
  fetchData: () => Promise<any[]>;
  /** Column keys to export */
  columns: string[];
  /** Filename prefix */
  filename: string;
  /** Optional column formatters */
  formatters?: Record<string, (value: any) => any>;
  /** Entity path in dictionary for localized headers */
  entityPath?: string;
  /** Custom button label */
  label?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Disable specific formats */
  disabledFormats?: ExportFormat[];
  /** Custom icon */
  icon?: React.ReactNode;
}

export function ExportButton({
  fetchData,
  columns,
  filename,
  formatters,
  entityPath,
  label,
  variant = 'outline',
  size = 'sm',
  disabledFormats = [],
  icon
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const { dictionary, locale } = useDictionary();

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setExportFormat(format);

      // Fetch data
      const data = await fetchData();

      if (!data || data.length === 0) {
        SuccessToast(dictionary?.common?.no_data_to_export || 'No data to export');
        return;
      }

      // Process data
      const processedData = processDataForExport(data, columns, formatters);

      // Get localized headers
      const headers = entityPath && dictionary
        ? getLocalizedHeaders(columns, dictionary, entityPath)
        : columns;

      // Export based on format
      if (format === 'csv') {
        const csv = convertToCSV(processedData, headers);
        const fileName = formatFilename(filename, 'csv');
        downloadFile(csv, fileName, 'text/csv;charset=utf-8;');
        SuccessToast(dictionary?.common?.export_success_csv || 'Data exported to CSV');
      } else if (format === 'excel') {
        const excel = convertToExcel(processedData, headers, filename);
        const fileName = formatFilename(filename, 'xlsx');
        downloadFile(excel, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        SuccessToast(dictionary?.common?.export_success_excel || 'Data exported to Excel');
      }
    } catch (error) {
      console.error('Export failed:', error);
      SuccessToast(dictionary?.common?.export_failed || 'Export failed');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const buttonIcon = isExporting ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    icon || <Download className="h-4 w-4" />
  );

  const buttonLabel = label || dictionary?.common?.export || 'Export';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExporting}
          className="gap-2"
        >
          {buttonIcon}
          {size !== 'icon' && buttonLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'}>
        {!disabledFormats.includes('csv') && (
          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {dictionary?.common?.export_csv || 'Export as CSV'}
            {isExporting && exportFormat === 'csv' && (
              <Loader2 className="h-3 w-3 animate-spin ms-auto" />
            )}
          </DropdownMenuItem>
        )}
        {!disabledFormats.includes('excel') && (
          <DropdownMenuItem
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {dictionary?.common?.export_excel || 'Export as Excel'}
            {isExporting && exportFormat === 'excel' && (
              <Loader2 className="h-3 w-3 animate-spin ms-auto" />
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}