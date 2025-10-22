/**
 * FileCard Component
 * Displays a single file with preview, metadata, and actions
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import { X, Eye, FileIcon, VideoIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import type { FileCardProps, FileMetadata } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, formatBytes } from '@/lib/utils';

export function FileCard({
  file,
  progress,
  onRemove,
  onView,
  showActions = true,
  className,
}: FileCardProps) {
  const isFile = file instanceof File;
  const metadata = isFile ? null : (file as FileMetadata);

  const fileName = isFile ? file.name : metadata?.originalName || metadata?.filename || '';
  const fileSize = isFile ? file.size : metadata?.size || 0;
  const fileType = isFile ? file.type : metadata?.mimeType || '';

  // Determine icon
  const getIcon = () => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    if (fileType.startsWith('video/')) {
      return <VideoIcon className="h-5 w-5" />;
    }
    if (fileType.includes('pdf')) {
      return <FileTextIcon className="h-5 w-5" />;
    }
    return <FileIcon className="h-5 w-5" />;
  };

  // Get preview URL
  const getPreviewUrl = (): string | null => {
    if (isFile) {
      // For File objects, create object URL if it's an image
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    }

    // For FileMetadata, use the URL if it's an image
    if (metadata && metadata.mimeType.startsWith('image/')) {
      return metadata.url;
    }

    return null;
  };

  const previewUrl = getPreviewUrl();

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (isFile && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isFile, previewUrl]);

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-lg border p-3',
        className
      )}
    >
      {/* Preview/Icon */}
      <div className="flex-shrink-0">
        {previewUrl ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-md">
            <Image
              src={previewUrl}
              alt={fileName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
            {getIcon()}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-sm">{fileName}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(fileSize)}</p>

        {/* Progress Bar */}
        {progress !== undefined && progress < 100 && (
          <Progress value={progress} className="mt-2 h-1" />
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1">
          {onView && metadata && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onView}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View file</span>
            </Button>
          )}

          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={progress !== undefined && progress < 100}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
