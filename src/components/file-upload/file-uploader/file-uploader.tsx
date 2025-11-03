/**
 * FileUploader Component
 * Main dropzone component with drag & drop support
 */

'use client';

import * as React from 'react';
import Dropzone, { type FileRejection } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { FileUploaderProps } from '../types';
import { FileList } from './file-list';
import { cn, formatBytes } from '@/lib/utils';

export function FileUploader({
  value,
  onValueChange,
  onUpload,
  progresses,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  multiple = true,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = React.useState<File[]>(value || []);

  // Sync internal state with value prop
  React.useEffect(() => {
    if (value) {
      setFiles(value);
    }
  }, [value]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Check max files limit
      if (!multiple && acceptedFiles.length > 1) {
        toast.error('You can only upload one file at a time');
        return;
      }

      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files`);
        return;
      }

      // Add new files
      const newFiles = multiple
        ? [...files, ...acceptedFiles]
        : [acceptedFiles[0]];

      setFiles(newFiles);
      onValueChange?.(newFiles);

      // Handle rejections
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          errors.forEach((error) => {
            if (error.code === 'file-too-large') {
              toast.error(`${file.name} is too large. Maximum size is ${formatBytes(maxSize)}`);
            } else if (error.code === 'file-invalid-type') {
              toast.error(`${file.name} has an invalid file type`);
            } else {
              toast.error(`${file.name}: ${error.message}`);
            }
          });
        });
      }

      // Auto-upload if handler provided
      if (onUpload && newFiles.length > 0) {
        onUpload(newFiles).catch((error) => {
          toast.error(error instanceof Error ? error.message : 'Upload failed');
        });
      }
    },
    [files, maxFiles, multiple, maxSize, onUpload, onValueChange]
  );

  const onRemove = React.useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onValueChange?.(newFiles);
    },
    [files, onValueChange]
  );

  const isDisabled = disabled || files.length >= maxFiles;

  return (
    <div className={cn('space-y-4', className)}>
      <Dropzone
        onDrop={onDrop}
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFiles}
        multiple={multiple}
        disabled={isDisabled}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              'group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25',
              'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isDragActive && 'border-muted-foreground/50 bg-muted/25',
              isDisabled && 'pointer-events-none opacity-60'
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
              <div className="rounded-full border border-dashed p-3">
                <Upload
                  className="h-7 w-7 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              {isDragActive ? (
                <p className="font-medium text-muted-foreground">
                  Drop the files here
                </p>
              ) : (
                <div className="space-y-px">
                  <p className="font-medium text-muted-foreground">
                    Drag & drop files here, or click to select files
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {maxFiles > 1
                      ? `You can upload up to ${maxFiles === Infinity ? 'multiple' : maxFiles} files (up to ${formatBytes(maxSize)} each)`
                      : `Maximum file size: ${formatBytes(maxSize)}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Dropzone>

      {/* File List */}
      <FileList
        files={files}
        progresses={progresses}
        onRemove={onRemove}
      />
    </div>
  );
}
