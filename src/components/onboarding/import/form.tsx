"use client"

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { ImportCard } from "./card"
import { IMPORT_TYPES, SUPPORTED_FORMATS } from "./config"
import { importSchema } from "./validation"
import type { ImportFormData } from "./validation"

interface ImportFormProps {
  initialData?: ImportFormData
  onSubmit: (data: ImportFormData) => Promise<void>
  onSkip?: () => void
  onBack?: () => void
  isSubmitting?: boolean
}

export function ImportForm({
  initialData = {
    dataSource: "manual" as const,
    includeStudents: true,
    includeTeachers: true,
    includeParents: true,
  },
  onSubmit,
  onSkip,
  onBack,
  isSubmitting = false,
}: ImportFormProps) {
  const { dictionary } = useDictionary()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: initialData,
  })

  const selectedImportType = form.watch("dataSource")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const getImportIcon = (type: string) => {
    switch (type) {
      case "csv":
        return <Icons.fileSpreadsheet className="h-5 w-5" />
      case "excel":
        return <Icons.fileSpreadsheet className="h-5 w-5" />
      case "manual":
        return <Icons.edit className="h-5 w-5" />
      default:
        return <Icons.upload className="h-5 w-5" />
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Preview */}
          <ImportCard importType={selectedImportType} showPreview={true} />

          {/* Import Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>
                {dictionary?.marketing?.onboarding?.import?.chooseMethod ||
                  "Choose Import Method"}
              </CardTitle>
              <CardDescription>
                {dictionary?.marketing?.onboarding?.import?.howToAdd ||
                  "How would you like to add your school data?"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dataSource"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-4"
                      >
                        {IMPORT_TYPES.map((type) => (
                          <div
                            key={type.value}
                            className="flex items-start gap-3"
                          >
                            <RadioGroupItem
                              value={type.value}
                              id={type.value}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={type.value}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                {getImportIcon(type.value)}
                                {type.label}
                              </Label>
                              <p className="muted mt-1">{type.description}</p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* File Upload (if file import selected) */}
          {selectedImportType === "csv" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {dictionary?.marketing?.onboarding?.import?.uploadFile ||
                    "Upload File"}
                </CardTitle>
                <CardDescription>
                  {dictionary?.marketing?.onboarding?.import?.selectFile ||
                    `Select your ${selectedImportType.toUpperCase()} file to import`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-muted rounded-lg border-2 border-dashed p-6 text-center">
                    <input
                      type="file"
                      accept={
                        selectedImportType === "csv"
                          ? ".csv,.xlsx,.xls"
                          : undefined
                      }
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Icons.upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-sm">
                        {selectedFile ? (
                          <>
                            {dictionary?.marketing?.onboarding?.import
                              ?.selectedFile || "Selected"}
                            : {selectedFile.name}
                          </>
                        ) : (
                          <>
                            {dictionary?.marketing?.onboarding?.import
                              ?.clickToUpload ||
                              "Click to upload or drag and drop"}
                          </>
                        )}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {selectedImportType === "csv"
                          ? dictionary?.marketing?.onboarding?.import
                              ?.fileTypes || "CSV, Excel (.csv, .xlsx, .xls)"
                          : dictionary?.marketing?.onboarding?.import
                              ?.selectImportType || "Select import type"}
                      </p>
                    </Label>
                  </div>

                  {/* Download Template */}
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Icons.info className="h-4 w-4" />
                    <span>Need a template?</span>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      <Icons.download className="me-1 h-3 w-3" />
                      Download template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Entry Info */}
          {selectedImportType === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {dictionary?.marketing?.onboarding?.import?.manualEntry ||
                    "Manual Entry"}
                </CardTitle>
                <CardDescription>
                  {dictionary?.marketing?.onboarding?.import?.manualEntryDesc ||
                    "You can add data manually after completing the setup"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>
                    •{" "}
                    {dictionary?.marketing?.onboarding?.import
                      ?.addStudentsLater ||
                      "Add students and teachers one by one"}
                  </p>
                  <p>
                    •{" "}
                    {dictionary?.marketing?.onboarding?.import
                      ?.createClassesManually ||
                      "Import data later from your dashboard"}
                  </p>
                  <p>
                    •{" "}
                    {dictionary?.marketing?.onboarding?.import?.setUpSchedule ||
                      "Start with a small pilot group"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  {dictionary?.marketing?.onboarding?.import?.back || "Back"}
                </Button>
              )}
              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  disabled={isSubmitting}
                >
                  {dictionary?.marketing?.onboarding?.import?.skip ||
                    "Skip for now"}
                </Button>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting || (selectedImportType === "csv" && !selectedFile)
              }
            >
              {isSubmitting ? (
                <>
                  <div className="me-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  {dictionary?.marketing?.onboarding?.standOut?.continuing ||
                    "Continuing"}
                  ...
                </>
              ) : (
                dictionary?.marketing?.onboarding?.import?.continue ||
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default ImportForm
