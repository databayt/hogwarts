/**
 * FileList Component
 * Displays a list of files with scroll support
 */

'use client';

import * as React from 'react';
import type { FileListProps } from '../types';
import { FileCard } from './file-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function FileList({
  files,
  progresses,
  onRemove,
  onView,
  className,
}: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ScrollArea className={cn('h-fit w-full', className)}>
      <div className="max-h-64 space-y-3 px-1">
        {files.map((file, index) => {
          const fileName = file instanceof File ? file.name : file.filename;
          const progress = progresses?.[fileName];

          return (
            <FileCard
              key={index}
              file={file}
              progress={progress}
              onRemove={onRemove ? () => onRemove(index) : undefined}
              onView={onView ? () => onView(index) : undefined}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
