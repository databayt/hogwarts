/**
 * EnhancedDropzone Component
 * Advanced dropzone with animations, visual feedback, and accessibility
 */

'use client';

import * as React from 'react';
import Dropzone, { type FileRejection, type DropzoneState } from 'react-dropzone';
import {
  Upload,
  FileUp,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  Archive,
  Music,
  FileIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileUploaderProps } from '../types';
import { cn, formatBytes } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EnhancedDropzoneProps extends FileUploaderProps {
  dictionary?: any; // i18n dictionary
  variant?: 'default' | 'compact' | 'full';
  showStats?: boolean;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  'image': ImageIcon,
  'video': VideoIcon,
  'pdf': FileTextIcon,
  'audio': Music,
  'archive': Archive,
  'default': FileIcon,
};

const getFileTypeIcon = (mimeType: string): React.ElementType => {
  if (mimeType.startsWith('image/')) return fileTypeIcons.image;
  if (mimeType.startsWith('video/')) return fileTypeIcons.video;
  if (mimeType.startsWith('audio/')) return fileTypeIcons.audio;
  if (mimeType.includes('pdf')) return fileTypeIcons.pdf;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) {
    return fileTypeIcons.archive;
  }
  return fileTypeIcons.default;
};

export function EnhancedDropzone({
  value,
  onValueChange,
  onUpload,
  progresses,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  multiple = true,
  disabled = false,
  variant = 'default',
  showStats = true,
  dictionary,
  className,
}: EnhancedDropzoneProps) {
  const [files, setFiles] = React.useState<File[]>(value || []);
  const [dragCounter, setDragCounter] = React.useState(0);
  const [dropzoneState, setDropzoneState] = React.useState<'idle' | 'active' | 'reject'>('idle');
  const [recentAction, setRecentAction] = React.useState<'success' | 'error' | null>(null);

  // Sync internal state with value prop
  React.useEffect(() => {
    if (value) {
      setFiles(value);
    }
  }, [value]);

  // Clear recent action after animation
  React.useEffect(() => {
    if (recentAction) {
      const timer = setTimeout(() => setRecentAction(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [recentAction]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setDropzoneState('idle');

      // Check max files limit
      if (!multiple && acceptedFiles.length > 1) {
        toast.error(dictionary?.errors?.singleFileOnly || 'You can only upload one file at a time');
        setRecentAction('error');
        return;
      }

      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(
          dictionary?.errors?.maxFilesExceeded ||
          `You can only upload up to ${maxFiles} files`
        );
        setRecentAction('error');
        return;
      }

      // Add new files with animation
      const newFiles = multiple
        ? [...files, ...acceptedFiles]
        : [acceptedFiles[0]];

      setFiles(newFiles);
      onValueChange?.(newFiles);
      setRecentAction('success');

      // Handle rejections
      if (rejectedFiles.length > 0) {
        setRecentAction('error');
        rejectedFiles.forEach(({ file, errors }) => {
          errors.forEach((error) => {
            if (error.code === 'file-too-large') {
              toast.error(
                dictionary?.errors?.fileTooLarge ||
                `${file.name} is too large. Maximum size is ${formatBytes(maxSize)}`
              );
            } else if (error.code === 'file-invalid-type') {
              toast.error(
                dictionary?.errors?.invalidFileType ||
                `${file.name} has an invalid file type`
              );
            } else {
              toast.error(`${file.name}: ${error.message}`);
            }
          });
        });
      }

      // Auto-upload if handler provided
      if (onUpload && acceptedFiles.length > 0) {
        toast.promise(
          onUpload(acceptedFiles),
          {
            loading: dictionary?.uploading || 'Uploading files...',
            success: dictionary?.uploadSuccess || 'Files uploaded successfully',
            error: (error) => error instanceof Error ? error.message : 'Upload failed',
          }
        );
      }
    },
    [files, maxFiles, multiple, maxSize, onUpload, onValueChange, dictionary]
  );

  const onDragEnter = React.useCallback(() => {
    setDragCounter((prev) => prev + 1);
    setDropzoneState('active');
  }, []);

  const onDragLeave = React.useCallback(() => {
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setDropzoneState('idle');
      }
      return newCount;
    });
  }, []);

  const onDropRejected = React.useCallback(() => {
    setDropzoneState('reject');
    setRecentAction('error');
    setTimeout(() => setDropzoneState('idle'), 1000);
  }, []);

  const isDisabled = disabled || files.length >= maxFiles;
  const remainingSlots = maxFiles - files.length;

  const variants = {
    idle: { scale: 1, opacity: 1 },
    active: { scale: 1.02, opacity: 1 },
    reject: { scale: 0.98, opacity: 0.9 },
  };

  const iconVariants = {
    idle: { y: 0, rotate: 0 },
    active: { y: -5, rotate: 5 },
    reject: { y: 0, rotate: -5 },
  };

  const getDropzoneContent = (state: DropzoneState) => {
    const Icon = state.isDragActive ? FileUp : Upload;
    const stateClass = dropzoneState === 'reject' ? 'text-destructive' :
                      dropzoneState === 'active' ? 'text-primary' :
                      'text-muted-foreground';

    return (
      <>
        <motion.div
          className="rounded-full border-2 border-dashed p-4 mb-4"
          variants={iconVariants}
          animate={dropzoneState}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Icon className={cn('h-8 w-8', stateClass)} aria-hidden="true" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={dropzoneState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 text-center"
          >
            {state.isDragActive ? (
              <p className={cn('font-semibold text-lg', stateClass)}>
                {dictionary?.dropHere || 'Drop the files here'}
              </p>
            ) : (
              <>
                <p className="font-semibold text-lg text-foreground">
                  {dictionary?.dragDropTitle || 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dictionary?.or || 'or'}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                >
                  {dictionary?.browseFiles || 'Browse files'}
                </Button>
              </>
            )}

            {showStats && !state.isDragActive && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Badge variant="secondary" className="text-xs">
                  {maxFiles > 1
                    ? `${remainingSlots} ${dictionary?.slotsRemaining || 'slots remaining'}`
                    : `${formatBytes(maxSize)} ${dictionary?.maxSize || 'max'}`}
                </Badge>
                {accept && (
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(accept).join(', ')}
                  </Badge>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Recent action indicator */}
        <AnimatePresence>
          {recentAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4"
            >
              {recentAction === 'success' ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <AlertCircle className="h-6 w-6 text-destructive" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  const dropzoneClasses = {
    default: 'h-52',
    compact: 'h-32',
    full: 'h-64',
  };

  return (
    <Dropzone
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDropRejected={onDropRejected}
      accept={accept}
      maxSize={maxSize}
      maxFiles={maxFiles}
      multiple={multiple}
      disabled={isDisabled}
    >
      {(dropzoneProps) => (
        // @ts-expect-error - framer-motion and react-dropzone prop type compatibility issue
        <motion.div
          {...dropzoneProps.getRootProps()}
          className={cn(
            'group relative grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-8 py-6 text-center transition-all',
            dropzoneClasses[variant],
            dropzoneState === 'active' && 'border-primary bg-primary/5',
            dropzoneState === 'reject' && 'border-destructive bg-destructive/5',
            dropzoneState === 'idle' && 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/25',
            isDisabled && 'pointer-events-none opacity-60',
            'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          variants={variants}
          animate={dropzoneState}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <input {...dropzoneProps.getInputProps()} />
          {getDropzoneContent(dropzoneProps)}
        </motion.div>
      )}
    </Dropzone>
  );
}