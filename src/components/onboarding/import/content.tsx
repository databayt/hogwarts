"use client";

import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Button } from '@/components/ui/button';

interface Props {
  dictionary?: any;
}

export default function ImportContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {};
  const { enableNext } = useHostValidation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Enable next button since import is optional
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      try {
        // Here you would normally upload and process the file
        // For now, just store it locally
        setUploadedFile(file);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsUploading(false);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold">
              {dict.importData || "Import your student data"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dict.importDescription || "Upload your student records in Excel or CSV format."}
              <br />
              {dict.optional || "This is optional."}
            </p>
          </div>

          {/* Right side - Upload area */}
          <div className="lg:justify-self-end">
            {!uploadedFile ? (
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg h-[250px] w-[400px] flex flex-col items-center justify-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="font-medium">{dict.uploadYourFile || "Upload file"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dict.supportedFileTypes || "xlsx, xls, csv"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
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
              <div className="relative h-[250px] w-[400px] border rounded-lg overflow-hidden flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
  );
}