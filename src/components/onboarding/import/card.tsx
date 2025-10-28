"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileSpreadsheet, Edit, CheckCircle } from 'lucide-react';
import type { ImportResult } from '@/lib/import-parser';

interface ImportCardProps {
  result?: ImportResult;
  importType?: string;
  showPreview?: boolean;
}

export function ImportCard({ 
  result,
  importType,
  showPreview = true
}: ImportCardProps) {
  const getImportIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <FileSpreadsheet className="h-6 w-6" />;
      case 'excel':
        return <FileSpreadsheet className="h-6 w-6" />;
      case 'manual':
        return <Edit className="h-6 w-6" />;
      default:
        return <Upload className="h-6 w-6" />;
    }
  };

  const getImportTypeLabel = (type: string) => {
    switch (type) {
      case 'csv':
        return 'CSV File Import';
      case 'excel':
        return 'Excel File Import';
      case 'manual':
        return 'Manual Entry';
      default:
        return 'Data Import';
    }
  };

  if (!showPreview && !result) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import your existing student and teacher data
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-chart-2" />
            ) : (
              <Upload className="h-5 w-5 text-chart-1" />
            )}
            Import Result
          </CardTitle>
          <CardDescription>
            {result.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 muted">
            <div>
              <p className="text-muted-foreground">Imported</p>
              <h5 className="text-chart-2">{result.imported}</h5>
            </div>
            <div>
              <p className="text-muted-foreground">Skipped</p>
              <h5 className="text-chart-1">{result.skipped}</h5>
            </div>
          </div>
          
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2">Errors:</p>
              <div className="space-y-1">
                {result.errors.slice(0, 3).map((error, index) => (
                  <p key={index} className="muted text-destructive">
                    {typeof error === 'string' ? error : `Row ${error.row}: ${error.message}`}
                  </p>
                ))}
                {result.errors.length > 3 && (
                  <p className="muted">
                    +{result.errors.length - 3} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getImportIcon(importType || 'default')}
          {getImportTypeLabel(importType || 'default')}
        </CardTitle>
        <CardDescription>
          Preview of your import method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted rounded-lg">
          {importType === 'manual' ? (
            <div className="text-center">
              <Edit className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="muted">Ready to add data manually</p>
            </div>
          ) : (
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="muted">Ready to import data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ImportCard;