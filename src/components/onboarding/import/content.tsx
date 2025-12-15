"use client"

import React, { useState } from "react"
import { FileText, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

interface Props {
  dictionary?: any
}

export default function ImportContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const { enableNext } = useHostValidation()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Enable next button since import is optional
  React.useEffect(() => {
    enableNext()
  }, [enableNext])

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)

      try {
        // Here you would normally upload and process the file
        // For now, just store it locally
        setUploadedFile(file)
      } catch (error) {
        console.error("Error uploading file:", error)
      } finally {
        setIsUploading(false)
      }
    }

    // Reset input
    event.target.value = ""
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="grid grid-cols-1 items-start gap-20 lg:grid-cols-2">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold">
              {dict.importData || "Import your student data"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {dict.importDescription ||
                "Upload your student records in Excel or CSV format."}
              <br />
              {dict.optional || "This is optional."}
            </p>
          </div>

          {/* Right side - Upload area */}
          <div className="lg:justify-self-end">
            {!uploadedFile ? (
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-muted-foreground/30 hover:border-muted-foreground/50 flex h-[250px] w-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors">
                  <Upload className="text-muted-foreground mb-4 h-10 w-10" />
                  <p className="font-medium">
                    {dict.uploadYourFile || "Upload file"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {dict.supportedFileTypes || "xlsx, xls, csv"}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {dict.optional || "(Optional)"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="sr-only"
                  />
                </div>
              </label>
            ) : (
              <div className="relative flex h-[250px] w-[400px] items-center justify-center overflow-hidden rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <FileText className="text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {uploadedFile.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
