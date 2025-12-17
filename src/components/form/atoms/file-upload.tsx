"use client"

/**
 * File Upload Field (Atom)
 *
 * Drag-and-drop file upload field with react-hook-form integration.
 * Wraps the Uploader component with form field semantics.
 *
 * **Role**: Single-purpose atom for file uploads in forms
 *
 * **Usage Across App**:
 * - Apply forms (documents, certificates)
 * - Profile forms (avatar, banner)
 * - Assignment submissions
 * - Receipt uploads
 * - Certificate uploads
 *
 * @example
 * ```tsx
 * <FileUploadField
 *   name="documents"
 *   label="Upload Documents"
 *   category="document"
 *   type="pdf"
 *   maxFiles={5}
 *   maxSize={10 * 1024 * 1024}
 *   required
 * />
 * ```
 */
import * as React from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type {
  FileCategory,
  FileType,
  StorageProvider,
  StorageTier,
} from "@/components/file/types"
import { Uploader } from "@/components/file/upload/uploader"
import type { UploadResult } from "@/components/file/upload/use-upload"

interface FileUploadFieldProps {
  /** Field name in form */
  name: string
  /** Field label */
  label?: string
  /** Field description */
  description?: string
  /** File category (image, document, etc.) */
  category: FileCategory
  /** Specific file type (avatar, pdf, etc.) */
  type?: FileType
  /** Storage folder path */
  folder?: string
  /** Storage provider */
  provider?: StorageProvider
  /** Storage tier */
  tier?: StorageTier
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Allowed MIME types */
  allowedTypes?: string[]
  /** Is field required? */
  required?: boolean
  /** Is field disabled? */
  disabled?: boolean
  /** Additional className */
  className?: string
  /** Uploader variant */
  variant?: "default" | "compact" | "avatar" | "banner"
  /** Show file preview */
  showPreview?: boolean
  /** Show file list */
  showFileList?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Accept mapping for dropzone */
  accept?: Record<string, string[]>
  /** Dictionary for i18n */
  dictionary?: {
    dropzone?: string
    browse?: string
    uploading?: string
    uploadComplete?: string
    uploadFailed?: string
    remove?: string
    maxSize?: string
  }
  /** Callback when upload completes */
  onUploadComplete?: (results: UploadResult[]) => void
  /** Callback on upload error */
  onUploadError?: (error: string) => void
}

export function FileUploadField({
  name,
  label,
  description,
  category,
  type,
  folder,
  provider,
  tier,
  maxSize,
  maxFiles = 1,
  allowedTypes,
  required,
  disabled,
  className,
  variant = "default",
  showPreview = true,
  showFileList = true,
  placeholder,
  accept,
  dictionary,
  onUploadComplete,
  onUploadError,
}: FileUploadFieldProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Uploader
              category={category}
              type={type}
              folder={folder}
              provider={provider}
              tier={tier}
              maxSize={maxSize}
              maxFiles={maxFiles}
              allowedTypes={allowedTypes}
              disabled={disabled}
              variant={variant}
              showPreview={showPreview}
              showFileList={showFileList}
              placeholder={placeholder}
              accept={accept}
              dictionary={dictionary}
              onFilesChange={(files) => {
                // Store uploaded file results in form
                if (maxFiles === 1) {
                  // Single file: store the first result or null
                  field.onChange(files[0] ?? null)
                } else {
                  // Multiple files: store array
                  field.onChange(files)
                }
              }}
              onUploadComplete={(results) => {
                onUploadComplete?.(results)
              }}
              onUploadError={(error) => {
                onUploadError?.(error)
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export type { FileUploadFieldProps }
