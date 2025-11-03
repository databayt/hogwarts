/**
 * UploadQueue Component
 * Advanced upload queue management with progress tracking, speed, and ETA
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  Trash2,
  Download
} from 'lucide-react';
import type { FileUploadState } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatBytes, nFormatter } from '@/lib/utils';

interface UploadQueueProps {
  uploads: FileUploadState[];
  onPause?: (fileId: string) => void;
  onResume?: (fileId: string) => void;
  onCancel?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
  onClearCompleted?: () => void;
  maxHeight?: number;
  variant?: 'default' | 'compact' | 'minimal';
  dictionary?: any;
  className?: string;
}

interface UploadSpeed {
  bytesPerSecond: number;
  remainingTime: number;
  startTime: number;
  lastBytes: number;
}

export function UploadQueue({
  uploads,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onClearCompleted,
  maxHeight = 400,
  variant = 'default',
  dictionary,
  className,
}: UploadQueueProps) {
  const [speeds, setSpeeds] = React.useState<Record<string, UploadSpeed>>({});
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedUploads, setSelectedUploads] = React.useState<Set<string>>(new Set());

  // Calculate upload speeds and ETAs
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSpeeds((prevSpeeds) => {
        const newSpeeds = { ...prevSpeeds };

        uploads.forEach((upload) => {
          if (upload.status === 'uploading' && upload.progress > 0) {
            const fileId = upload.file.name;
            const currentTime = Date.now();
            const bytesUploaded = (upload.progress / 100) * upload.file.size;

            if (!newSpeeds[fileId]) {
              newSpeeds[fileId] = {
                bytesPerSecond: 0,
                remainingTime: 0,
                startTime: currentTime,
                lastBytes: 0,
              };
            }

            const elapsedTime = (currentTime - newSpeeds[fileId].startTime) / 1000;
            const bytesPerSecond = bytesUploaded / elapsedTime;
            const remainingBytes = upload.file.size - bytesUploaded;
            const remainingTime = remainingBytes / bytesPerSecond;

            newSpeeds[fileId] = {
              bytesPerSecond,
              remainingTime,
              startTime: newSpeeds[fileId].startTime,
              lastBytes: bytesUploaded,
            };
          }
        });

        return newSpeeds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [uploads]);

  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const pendingUploads = uploads.filter((u) => u.status === 'pending');
  const completedUploads = uploads.filter((u) => u.status === 'success');
  const failedUploads = uploads.filter((u) => u.status === 'error');

  const totalProgress = React.useMemo(() => {
    if (uploads.length === 0) return 0;
    const sum = uploads.reduce((acc, upload) => acc + (upload.progress || 0), 0);
    return Math.round(sum / uploads.length);
  }, [uploads]);

  const formatETA = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return '--:--';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (!isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '-- KB/s';

    if (bytesPerSecond < 1024) {
      return `${Math.round(bytesPerSecond)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${Math.round(bytesPerSecond / 1024)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  };

  const getStatusIcon = (status: FileUploadState['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
        return <Activity className="h-4 w-4 text-primary animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderUploadItem = (upload: FileUploadState, index: number) => {
    const speed = speeds[upload.file.name];
    const isSelected = selectedUploads.has(upload.file.name);

    return (
      <motion.div
        key={upload.file.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'group relative rounded-lg border p-3 transition-all',
          isSelected && 'border-primary bg-primary/5',
          upload.status === 'error' && 'border-destructive/50 bg-destructive/5',
          upload.status === 'success' && 'border-success/50 bg-success/5'
        )}
        onClick={() => {
          setSelectedUploads((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(upload.file.name)) {
              newSet.delete(upload.file.name);
            } else {
              newSet.add(upload.file.name);
            }
            return newSet;
          });
        }}
      >
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-1">
            {getStatusIcon(upload.status)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {upload.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(upload.file.size)}
                  </span>
                  {upload.status === 'uploading' && speed && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        <Zap className="h-3 w-3 mr-1" />
                        {formatSpeed(speed.bytesPerSecond)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatETA(speed.remainingTime)}
                      </Badge>
                    </>
                  )}
                  {upload.status === 'success' && (
                    <Badge variant="secondary" className="text-xs">
                      {dictionary?.completed || 'Completed'}
                    </Badge>
                  )}
                  {upload.status === 'error' && (
                    <Badge variant="destructive" className="text-xs">
                      {upload.error || dictionary?.failed || 'Failed'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {upload.status === 'uploading' && (
                  <>
                    {onPause && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPause(upload.file.name);
                              }}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{dictionary?.pause || 'Pause'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {onCancel && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancel(upload.file.name);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{dictionary?.cancel || 'Cancel'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}

                {upload.status === 'error' && onRetry && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry(upload.file.name);
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary?.retry || 'Retry'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {(upload.status === 'success' || upload.status === 'error') && onRemove && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(upload.file.name);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary?.remove || 'Remove'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {upload.status === 'uploading' && (
              <div className="mt-2 space-y-1">
                <Progress value={upload.progress} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{upload.progress}%</span>
                  <span>
                    {formatBytes((upload.progress / 100) * upload.file.size)} / {formatBytes(upload.file.size)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (uploads.length === 0) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-2', className)}>
        <AnimatePresence mode="popLayout">
          {uploads.map((upload, index) => renderUploadItem(upload, index))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {dictionary?.uploadQueue || 'Upload Queue'}
            </CardTitle>
            <div className="flex items-center gap-1">
              {activeUploads.length > 0 && (
                <Badge variant="default" className="text-xs">
                  {activeUploads.length} {dictionary?.active || 'active'}
                </Badge>
              )}
              {pendingUploads.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingUploads.length} {dictionary?.pending || 'pending'}
                </Badge>
              )}
              {completedUploads.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {completedUploads.length} {dictionary?.completed || 'completed'}
                </Badge>
              )}
              {failedUploads.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {failedUploads.length} {dictionary?.failed || 'failed'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {completedUploads.length > 0 && onClearCompleted && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearCompleted}
                className="text-xs"
              >
                {dictionary?.clearCompleted || 'Clear completed'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        {activeUploads.length > 0 && !collapsed && (
          <div className="mt-3 space-y-1">
            <Progress value={totalProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {dictionary?.overallProgress || 'Overall progress'}: {totalProgress}%
            </p>
          </div>
        )}
      </CardHeader>

      <Collapsible open={!collapsed}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="w-full" style={{ maxHeight }}>
              <div className="space-y-2 pr-3">
                <AnimatePresence mode="popLayout">
                  {uploads.map((upload, index) => renderUploadItem(upload, index))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}