/**
 * Receipt Upload Form Component
 * Follows Hogwarts client component pattern
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { uploadReceipt } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, FileText, Loader2 } from 'lucide-react'

interface UploadFormProps {
  locale?: string
}

export function UploadForm({ locale = 'en' }: UploadFormProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload an image (JPEG, PNG, WEBP) or PDF.')
        return
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB.')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile) {
      toast.error('Please select a file to upload.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await uploadReceipt(formData)

      if (result.success && result.data) {
        toast.success('Receipt uploaded successfully! AI extraction in progress...')
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Redirect to receipt detail page (relative to current route)
        router.push(`${result.data.receiptId}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Upload failed. Please try again.')
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <FileText className="h-12 w-12 mx-auto text-primary" />
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Change File
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">Choose a file</span>
                {' or drag and drop'}
              </Label>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP or PDF (max 10MB)
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Receipt
          </>
        )}
      </Button>
    </form>
  )
}
