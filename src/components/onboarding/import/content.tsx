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
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              {dict.importData || "Import your student data"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dict.importDescription || "Upload your student records in Excel or CSV format."} <br /> <a href="/docs/import" className="text-primary underline">{dict.importGuide || "import guide"}</a>
            </p>
          </div>
          
          {/* Right side - Upload area */}
          <div>
            {!uploadedFile ? (
              // Initial upload box
              <div className="border border-dashed border-muted-foreground rounded-lg text-center bg-muted p-12 space-y-8 min-h-[250px] flex flex-col justify-center">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{dict.uploadYourFile || "Upload your file"}</p>
                  <p className="text-xs text-muted-foreground">
                  {dict.supportedFileTypes || "pdf, xlsx, xls, csv, docx, doc"}
                  </p>
                </div>

                <div>
                  <label htmlFor="file-upload">
                    <Button
                      variant="outline"
                      className="relative cursor-pointer"
                      disabled={isUploading}
                    >
                      {isUploading ? (dict.uploading || 'Uploading...') : (dict.chooseFile || 'Choose file')}
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="sr-only"
                      />
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              // File preview
              <div className="border rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
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
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}