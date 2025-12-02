"use client";

import * as React from 'react';
import { useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Upload, X, FileText, File, Image, FileAudio, Save, Send, CircleAlert, LoaderCircle, Video } from "lucide-react";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  totalPoints: number;
  dueDate: Date | string;
  type: string;
  class: {
    name: string;
    subject: {
      subjectName: string;
    };
  };
}

interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface SubmissionFormProps {
  assignment: Assignment;
  studentId: string;
  existingSubmission?: {
    content?: string;
    attachments?: string[];
    status: string;
  };
  onSubmit: (data: {
    content: string;
    attachments: string[];
    isDraft: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
];

export function SubmissionForm({
  assignment,
  studentId,
  existingSubmission,
  onSubmit,
  onCancel,
}: SubmissionFormProps) {
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate file upload (replace with actual upload logic)
  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const uploadId = Math.random().toString(36).substring(7);
      const newFile: FileUpload = {
        id: uploadId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading',
      };

      setFiles(prev => [...prev, newFile]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === uploadId && f.progress < 100) {
            const newProgress = Math.min(f.progress + 10, 100);
            if (newProgress === 100) {
              clearInterval(interval);
              return {
                ...f,
                progress: newProgress,
                status: 'completed',
                url: `https://storage.example.com/${uploadId}/${file.name}`,
              };
            }
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        resolve(`https://storage.example.com/${uploadId}/${file.name}`);
      }, 2000);
    });
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type.`);
        continue;
      }

      // Upload file
      try {
        await uploadFile(file);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const attachmentUrls = files
        .filter(f => f.status === 'completed' && f.url)
        .map(f => f.url!);

      await onSubmit({
        content,
        attachments: attachmentUrls,
        isDraft: true,
      });
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      toast.error('Please add content or attach files before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const attachmentUrls = files
        .filter(f => f.status === 'completed' && f.url)
        .map(f => f.url!);

      await onSubmit({
        content,
        attachments: attachmentUrls,
        isDraft: false,
      });
      toast.success('Assignment submitted successfully');
    } catch (error) {
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalUploadProgress = files.length > 0
    ? files.reduce((sum, f) => sum + f.progress, 0) / files.length
    : 0;

  const isUploading = files.some(f => f.status === 'uploading');
  const dueDate = new Date(assignment.dueDate);
  const isPastDue = dueDate < new Date();

  return (
    <div className="space-y-6">
      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.class.subject.subjectName} • {assignment.class.name}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {assignment.totalPoints} points
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
            </div>
          )}

          {assignment.instructions && (
            <div>
              <Label>Instructions</Label>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {assignment.instructions}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Due: </span>
              <span className={cn("font-medium", isPastDue && "text-red-600")}>
                {format(dueDate, 'MMM dd, yyyy at h:mm a')}
              </span>
            </div>
            {isPastDue && (
              <Badge variant="destructive">Late Submission</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submission</CardTitle>
          <CardDescription>
            Add your response and attach any required files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPastDue && (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Late Submission</AlertTitle>
              <AlertDescription>
                This assignment is past due. Your submission will be marked as late.
              </AlertDescription>
            </Alert>
          )}

          {/* Text Response */}
          <div>
            <Label htmlFor="response">Written Response</Label>
            <Textarea
              id="response"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[200px] mt-2"
              disabled={isSubmitting}
            />
          </div>

          <Separator />

          {/* File Attachments */}
          <div>
            <Label>File Attachments</Label>
            <div className="mt-2 space-y-4">
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center",
                  "hover:border-primary/50 transition-colors cursor-pointer",
                  isUploading && "pointer-events-none opacity-50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  disabled={isSubmitting || isUploading}
                />
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Excel, PowerPoint, Images, Videos (max 10MB)
                </p>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading files...</span>
                    <span>{Math.round(totalUploadProgress)}%</span>
                  </div>
                  <Progress value={totalUploadProgress} className="h-2" />
                </div>
              )}

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        file.status === 'error' && "border-red-200 bg-red-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <div className="flex items-center gap-2">
                            <Progress value={file.progress} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {file.progress}%
                            </span>
                          </div>
                        )}
                        {file.status === 'completed' && (
                          <Badge variant="outline" className="text-green-600">
                            Uploaded
                          </Badge>
                        )}
                        {file.status === 'error' && (
                          <Badge variant="outline" className="text-red-600">
                            Failed
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file.id)}
                          disabled={file.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save as Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Assignment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}