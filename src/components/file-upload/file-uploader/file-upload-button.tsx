/**
 * FileUploadButton Component
 * Dialog-based file upload with button trigger
 */

'use client';

import * as React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FileUploadButtonProps, FileCategory } from '../types';
import { useFileUpload } from '../hooks/use-file-upload';
import { getAcceptPattern } from '../config/file-types';
import { FILE_SIZE_LIMITS } from '../config/storage-config';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileUploader } from './file-uploader';

export function FileUploadButton({
  accept,
  maxSize,
  onUpload,
  onError,
  disabled = false,
  label = 'Upload File',
  description = 'Select a file to upload',
  className,
}: FileUploadButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);

  // Determine category and accept pattern
  const category = (
    typeof accept === 'string' ? accept : 'document'
  ) as FileCategory;

  const acceptPattern =
    typeof accept === 'string' ? getAcceptPattern(category) : { [accept]: [] };

  const maxSizeValue =
    maxSize || (FILE_SIZE_LIMITS as any)[category] || 10 * 1024 * 1024;

  // Use file upload hook
  const { upload, isUploading, progress } = useFileUpload({
    category,
    maxSize: maxSizeValue,
    onSuccess: (result) => {
      if (result.metadata) {
        onUpload(result.metadata);
        setOpen(false);
        setFiles([]);
      }
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select a file');
      return;
    }

    await upload(files[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className={className}>
          <Upload className="me-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FileUploader
            value={files}
            onValueChange={setFiles}
            accept={acceptPattern}
            maxSize={maxSizeValue}
            maxFiles={1}
            multiple={false}
            progresses={progress}
            disabled={isUploading}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
            >
              {isUploading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
