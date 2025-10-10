"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, FileSpreadsheet, Edit, Info, Download } from 'lucide-react';
import { importSchema } from './validation';
import { IMPORT_TYPES, SUPPORTED_FORMATS } from "./config";
import { ImportCard } from './card';
import type { ImportFormData } from './validation';

interface ImportFormProps {
  initialData?: ImportFormData;
  onSubmit: (data: ImportFormData) => Promise<void>;
  onSkip?: () => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export function ImportForm({
  initialData = { 
    dataSource: 'manual' as const,
    includeStudents: true,
    includeTeachers: true,
    includeParents: true,
  },
  onSubmit,
  onSkip,
  onBack,
  isSubmitting = false,
}: ImportFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: initialData,
  });

  const selectedImportType = form.watch('dataSource');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getImportIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'manual':
        return <Edit className="h-5 w-5" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Preview */}
          <ImportCard
            importType={selectedImportType}
            showPreview={true}
          />

          {/* Import Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Import Method</CardTitle>
              <CardDescription>
                How would you like to add your school data?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dataSource"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-4"
                      >
                        {IMPORT_TYPES.map((type) => (
                          <div key={type.value} className="flex items-start space-x-3">
                            <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                            <div className="flex-1">
                              <Label 
                                htmlFor={type.value} 
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                {getImportIcon(type.value)}
                                {type.label}
                              </Label>
                              <p className="muted mt-1">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* File Upload (if file import selected) */}
          {selectedImportType === 'csv' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>
                  Select your {selectedImportType.toUpperCase()} file to import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept={selectedImportType === 'csv' ? '.csv,.xlsx,.xls' : undefined}
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">
                        {selectedFile ? (
                          <>Selected: {selectedFile.name}</>
                        ) : (
                          <>Click to upload or drag and drop</>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedImportType === 'csv' ? 'CSV, Excel (.csv, .xlsx, .xls)' : 'Select import type'}
                      </p>
                    </Label>
                  </div>

                  {/* Download Template */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Need a template?</span>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      <Download className="h-3 w-3 mr-1" />
                      Download template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Entry Info */}
          {selectedImportType === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  You can add data manually after completing the setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Add students and teachers one by one</p>
                  <p>• Import data later from your dashboard</p>
                  <p>• Start with a small pilot group</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  disabled={isSubmitting}
                >
                  Skip for now
                </Button>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={
                isSubmitting || 
                (selectedImportType === 'csv' && !selectedFile)
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ImportForm;