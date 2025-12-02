/**
 * Receipt Upload Form Component
 * Follows Hogwarts client component pattern
 * Migrated to use enhanced FileUploader component
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { uploadReceipt } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, LoaderCircle } from "lucide-react"
import { FileUploader, ACCEPT_IMAGES, ACCEPT_DOCUMENTS, type UploadedFileResult } from '@/components/file-upload/enhanced/file-uploader'

interface UploadFormProps {
  locale?: string
}

// Combine image and PDF acceptance
const RECEIPT_ACCEPT = {
  ...ACCEPT_IMAGES,
  'application/pdf': ['.pdf'],
}

export function UploadForm({ locale = 'en' }: UploadFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFileResult[]>([])

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    setUploadedFiles(files)
    toast.success('File uploaded successfully! Ready to process.')
  }

  const handleUploadError = (error: string) => {
    toast.error(error)
  }

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload a file first.')
      return
    }

    setIsProcessing(true)

    try {
      // For now, we pass the fileId to the action
      // The action will need to be updated to accept fileId instead of FormData
      // This is a TODO for Phase 4 completion
      const fileId = uploadedFiles[0].fileId
      const formData = new FormData()
      formData.append('fileId', fileId)

      const result = await uploadReceipt(formData)

      if (result.success && result.data) {
        toast.success('Receipt processed successfully! AI extraction in progress...')
        setUploadedFiles([])
        // Redirect to receipt detail page (relative to current route)
        router.push(`${result.data.receiptId}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Processing failed. Please try again.')
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      {uploadedFiles.length === 0 ? (
        <FileUploader
          category="DOCUMENT"
          folder="receipts"
          accept={RECEIPT_ACCEPT}
          maxFiles={1}
          multiple={false}
          maxSize={10 * 1024 * 1024} // 10MB max
          optimizeImages={false} // Don't optimize receipts, keep original
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center border-primary/50">
          <div className="space-y-2">
            <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">File uploaded successfully</p>
            <p className="text-xs text-muted-foreground">
              Ready to process with AI extraction
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadedFiles([])}
            >
              Change File
            </Button>
          </div>
        </div>
      )}

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={uploadedFiles.length === 0 || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Processing Receipt...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Process Receipt
          </>
        )}
      </Button>
    </div>
  )
}
