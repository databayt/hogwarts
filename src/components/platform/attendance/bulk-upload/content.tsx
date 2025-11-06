"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { useAttendanceContext } from '../core/attendance-context';
import { FileUploader, ACCEPT_DOCUMENTS, type UploadedFileResult } from '@/components/file-upload/enhanced/file-uploader';
import { toast } from 'sonner';

interface BulkUploadContentProps {
  dictionary?: any;
}

export function BulkUploadContent({ dictionary }: BulkUploadContentProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      total: number;
      successful: number;
      failed: number;
      errors?: string[];
    };
  } | null>(null);

  const { stats } = useAttendanceContext();

  // Dictionary shorthand
  const d = dictionary?.school?.attendance?.bulkUpload;

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
      setShowUploader(false);
      setUploadResult(null);
      toast.success('File uploaded successfully');
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const handleProcess = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadResult(null);

    // Process the uploaded file
    try {
      // In real implementation, this would call an API endpoint with the file URL
      // await processBulkAttendance({ fileUrl: uploadedFile.cdnUrl || uploadedFile.url });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful result
      setUploadResult({
        success: true,
        message: d?.results?.success || 'Attendance records processed successfully!',
        details: {
          total: 150,
          successful: 145,
          failed: 5,
          errors: [
            'Row 23: Invalid student ID',
            'Row 45: Date format error',
            'Row 67: Duplicate entry',
            'Row 89: Missing required field',
            'Row 112: Invalid attendance status'
          ]
        }
      });
      setUploadedFile(null);
    } catch (error) {
      setUploadResult({
        success: false,
        message: d?.results?.failed || 'Processing failed. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // In real implementation, this would download a template file
    const csvContent = "Student ID,Student Name,Date,Status,Time In,Time Out,Notes\n" +
                      "STU001,John Doe,2024-01-15,PRESENT,08:00,15:00,\n" +
                      "STU002,Jane Smith,2024-01-15,PRESENT,08:15,15:00,Late arrival\n" +
                      "STU003,Bob Johnson,2024-01-15,ABSENT,,,Sick leave";

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {d?.instructions?.title || 'Instructions'}
          </CardTitle>
          <CardDescription>
            {d?.instructions?.description || 'Follow these steps to bulk upload attendance records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal list-inside">
            <li>{d?.instructions?.step1 || 'Download the template file using the button below'}</li>
            <li>{d?.instructions?.step2 || 'Fill in the attendance data following the format in the template'}</li>
            <li>{d?.instructions?.step3 || 'Save the file as CSV or Excel format'}</li>
            <li>{d?.instructions?.step4 || 'Upload the completed file using the upload section'}</li>
            <li>{d?.instructions?.step5 || 'Review the upload results and fix any errors if needed'}</li>
          </ol>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {d?.template?.title || 'Download Template'}
          </CardTitle>
          <CardDescription>
            {d?.template?.description || 'Get a pre-formatted template to fill in attendance data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {d?.template?.download || 'Download CSV Template'}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {d?.upload?.title || 'Upload Attendance File'}
          </CardTitle>
          <CardDescription>
            {d?.upload?.description || 'Select and upload your completed attendance file'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadedFile ? (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{d?.upload?.fileUploaded || 'File uploaded successfully: '}{uploadedFile.fileId}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploader(true)}
                  >
                    {d?.upload?.changeFile || 'Change File'}
                  </Button>
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleProcess}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>{d?.upload?.processing || 'Processing...'}</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {d?.upload?.processButton || 'Process Attendance Data'}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {d?.upload?.selectFile || 'Upload your completed attendance file (CSV or Excel)'}
              </p>
              <Button
                variant="outline"
                onClick={() => setShowUploader(true)}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {d?.upload?.selectButton || 'Select File'}
              </Button>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <Alert variant={uploadResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {uploadResult.success ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <div className="space-y-2">
                  <AlertDescription>{uploadResult.message}</AlertDescription>
                  {uploadResult.details && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <p>{(d?.results?.total || 'Total records: {count}').replace('{count}', uploadResult.details.total.toString())}</p>
                        <p>{(d?.results?.successful || 'Successful: {count}').replace('{count}', uploadResult.details.successful.toString())}</p>
                        <p>{(d?.results?.failedCount || 'Failed: {count}').replace('{count}', uploadResult.details.failed.toString())}</p>
                      </div>
                      {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold text-sm">{d?.results?.errors || 'Errors:'}</p>
                          <ul className="text-sm list-disc list-inside">
                            {uploadResult.details.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {d?.recentUploads?.title || 'Recent Bulk Uploads'}
          </CardTitle>
          <CardDescription>
            {d?.recentUploads?.description || 'History of your recent bulk attendance uploads'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">attendance_2024_01_15.csv</p>
                  <p className="text-xs text-muted-foreground">
                    {(d?.recentUploads?.uploadedAgo || 'Uploaded {time} ago').replace('{time}', (d?.recentUploads?.hoursAgo || '{hours} hours ago').replace('{hours}', '2'))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">145/150</p>
                <p className="text-xs text-muted-foreground">{d?.results?.recordsProcessed || 'Records processed'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">attendance_2024_01_14.xlsx</p>
                  <p className="text-xs text-muted-foreground">
                    {(d?.recentUploads?.uploadedAgo || 'Uploaded {time} ago').replace('{time}', d?.recentUploads?.yesterday || 'yesterday')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">200/200</p>
                <p className="text-xs text-muted-foreground">{d?.results?.recordsProcessed || 'Records processed'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">attendance_2024_01_12.csv</p>
                  <p className="text-xs text-muted-foreground">
                    {(d?.recentUploads?.uploadedAgo || 'Uploaded {time} ago').replace('{time}', (d?.recentUploads?.daysAgo || '{days} days ago').replace('{days}', '3'))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-yellow-600">178/185</p>
                <p className="text-xs text-muted-foreground">{d?.results?.recordsProcessed || 'Records processed'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {d?.summary?.title || 'Current Attendance Summary'}
            </CardTitle>
            <CardDescription>
              {d?.summary?.description || 'Overall attendance statistics after bulk uploads'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">{dictionary?.school?.attendance?.stats?.totalStudents || 'Total Students'}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{dictionary?.school?.attendance?.present || 'Present Today'}</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{dictionary?.school?.attendance?.absent || 'Absent Today'}</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{dictionary?.school?.attendance?.late || 'Late Today'}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{d?.upload?.dialogTitle || 'Upload Attendance File'}</DialogTitle>
          </DialogHeader>
          <FileUploader
            category="DOCUMENT"
            folder="attendance/bulk-uploads"
            accept={{
              ...ACCEPT_DOCUMENTS,
              'text/csv': ['.csv'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            }}
            maxFiles={1}
            multiple={false}
            maxSize={100 * 1024 * 1024} // 100MB for bulk data
            optimizeImages={false}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}