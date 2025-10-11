"use client";

import { useState } from "react";
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { type Locale } from "@/components/internationalization/config";
import { type Dictionary } from "@/components/internationalization/dictionaries";

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
    details?: string; // Enhanced error details with suggestions
  }>;
  warnings?: Array<{
    row: number;
    warning: string;
  }>;
}

interface CsvImportComponentProps {
  dictionary: Dictionary;
  lang: Locale;
}

export function CsvImportComponent({ dictionary, lang }: CsvImportComponentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [studentResult, setStudentResult] = useState<ImportResult | null>(null);
  const [teacherResult, setTeacherResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (type: 'students' | 'teachers', file: File) => {
    setIsUploading(true);
    
    // Reset previous results
    if (type === 'students') {
      setStudentResult(null);
    } else {
      setTeacherResult(null);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      if (type === 'students') {
        setStudentResult(data);
      } else {
        setTeacherResult(data);
      }
    } catch (error) {
      const errorResult: ImportResult = {
        success: false,
        imported: 0,
        failed: 1,
        errors: [{
          row: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
      
      if (type === 'students') {
        setStudentResult(errorResult);
      } else {
        setTeacherResult(errorResult);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: 'students' | 'teachers') => {
    window.open(`/api/import?type=${type}`, '_blank');
  };

  const ImportTab = ({ 
    type, 
    title, 
    description,
    result 
  }: { 
    type: 'students' | 'teachers';
    title: string;
    description: string;
    result: ImportResult | null;
  }) => (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Instructions</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. Download the CSV template and fill in the required information</p>
          <p>2. Ensure all required fields are filled correctly</p>
          <p>3. Save the file as CSV (comma-separated values)</p>
          <p>4. Upload the completed file using the upload button below</p>
        </AlertDescription>
      </Alert>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Download Template</CardTitle>
          <CardDescription>
            Download the CSV template with the correct format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => downloadTemplate(type)}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download {title} Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload File */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload Completed CSV</CardTitle>
          <CardDescription>
            Upload your completed CSV file to import {title.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor={`${type}-upload`} className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files only</p>
                </div>
                <input
                  id={`${type}-upload`}
                  type="file"
                  className="hidden"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(type, file);
                    }
                  }}
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress className="w-full" />
                <p className="text-sm text-center text-muted-foreground">Importing {title.toLowerCase()}...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <><CheckCircle className="w-5 h-5 text-green-500" /> Import Results</>
              ) : (
                <><XCircle className="w-5 h-5 text-red-500" /> Import Failed</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Successfully Imported</p>
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Errors ({result.errors.length}):</h4>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p>
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </p>
                          {error.details && (
                            <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded border border-destructive/20 whitespace-pre-wrap">
                              {error.details}
                            </pre>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Warnings ({result.warnings.length}):</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {result.warnings.map((warning, index) => (
                    <Alert key={index} variant="default" className="border-yellow-500 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <span className="font-medium">Row {warning.row}:</span> {warning.warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {result.success && result.imported > 0 && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Successfully imported {result.imported} {type}. Default passwords have been set and should be changed on first login.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import</CardTitle>
          <CardDescription>
            Import multiple students or teachers at once using CSV files
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students">Import Students</TabsTrigger>
          <TabsTrigger value="teachers">Import Teachers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          <ImportTab
            type="students"
            title="Students"
            description="Import student records including basic information and guardian details"
            result={studentResult}
          />
        </TabsContent>
        
        <TabsContent value="teachers">
          <ImportTab
            type="teachers"
            title="Teachers"
            description="Import teacher records including contact information and department assignments"
            result={teacherResult}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}