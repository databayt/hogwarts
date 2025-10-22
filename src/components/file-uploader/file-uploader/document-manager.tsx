/**
 * DocumentManager Component
 * Manages multiple document uploads with requirements checklist
 */

'use client';

import * as React from 'react';
import { Check, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentManagerProps, ManagedDocument } from '../types';
import { useFileUpload } from '../hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, formatBytes } from '@/lib/utils';

export function DocumentManager({
  requirements,
  documents,
  onChange,
  disabled = false,
  className,
}: DocumentManagerProps) {
  const { upload, isUploading, progress } = useFileUpload({
    category: 'document',
    folder: 'student-records',
  });

  // Calculate completion
  const requiredDocs = requirements.filter((r) => r.required);
  const uploadedRequired = requiredDocs.filter((r) =>
    documents.some((d) => d.type === r.type && d.url)
  );
  const completionPercentage = requiredDocs.length > 0
    ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
    : 100;

  const handleFileSelect = async (
    type: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Find requirement
    const requirement = requirements.find((r) => r.type === type);
    if (!requirement) return;

    // Validate file size
    const maxSize = requirement.maxSize || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${formatBytes(maxSize)}`);
      return;
    }

    // Upload file
    const result = await upload(file);

    if (result.success && result.metadata) {
      // Add or update document
      const existingIndex = documents.findIndex((d) => d.type === type);
      const newDoc: ManagedDocument = {
        id: result.metadata.id,
        type: type as any,
        url: result.metadata.url,
        metadata: result.metadata,
        uploadedAt: result.metadata.uploadedAt,
        isVerified: false,
      };

      if (existingIndex >= 0) {
        // Replace existing
        const newDocs = [...documents];
        newDocs[existingIndex] = newDoc;
        onChange(newDocs);
      } else {
        // Add new
        onChange([...documents, newDoc]);
      }
    }

    // Reset input
    event.target.value = '';
  };

  const handleRemove = (type: string) => {
    const newDocs = documents.filter((d) => d.type !== type);
    onChange(newDocs);
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find((d) => d.type === type);
    if (!doc || !doc.url) return 'missing';
    if (doc.isVerified) return 'verified';
    return 'uploaded';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload Progress</CardTitle>
          <CardDescription>
            {uploadedRequired.length} of {requiredDocs.length} required documents uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            {completionPercentage}% complete
          </p>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        {requirements.map((requirement) => {
          const status = getDocumentStatus(requirement.type);
          const doc = documents.find((d) => d.type === requirement.type);
          const uploadProgress = doc?.metadata?.filename
            ? progress[doc.metadata.filename]
            : undefined;

          return (
            <Card key={requirement.type}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {requirement.label}
                      </CardTitle>
                      {requirement.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {status === 'verified' && (
                        <Badge variant="default" className="text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {status === 'uploaded' && (
                        <Badge variant="secondary" className="text-xs">
                          Uploaded
                        </Badge>
                      )}
                    </div>
                    {requirement.description && (
                      <CardDescription className="mt-1">
                        {requirement.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {status !== 'missing' && doc && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(requirement.type)}
                        disabled={disabled}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant={status === 'missing' ? 'default' : 'outline'}
                      size="sm"
                      disabled={disabled || isUploading}
                      asChild
                    >
                      <label>
                        <Upload className="mr-2 h-4 w-4" />
                        {status === 'missing' ? 'Upload' : 'Replace'}
                        <input
                          type="file"
                          accept={requirement.accept?.join(',') || '*/*'}
                          onChange={(e) => handleFileSelect(requirement.type, e)}
                          className="hidden"
                          disabled={disabled}
                        />
                      </label>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {doc && doc.url && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">
                        {doc.metadata?.originalName || 'Uploaded file'}
                      </p>
                      {doc.metadata && (
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(doc.metadata.size)} •{' '}
                          {new Date(doc.uploadedAt || '').toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>

                  {uploadProgress !== undefined && uploadProgress < 100 && (
                    <Progress value={uploadProgress} className="mt-2 h-1" />
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
