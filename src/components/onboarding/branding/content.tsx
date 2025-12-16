"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file"
import { FormHeading, FormLayout } from "@/components/form"
import { useHostValidation } from "@/components/onboarding/host-validation-context"
import { useListing } from "@/components/onboarding/use-listing"

interface Props {
  dictionary?: any
}

export default function BrandingContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const router = useRouter()
  const params = useParams()
  const { setCustomNavigation, enableNext } = useHostValidation()
  const { listing, updateListingData } = useListing()
  const [logo, setLogo] = useState<string>()
  const [showUploader, setShowUploader] = useState(false)

  const id = params?.id as string

  // Load existing logo from listing
  useEffect(() => {
    if (listing?.logoUrl) {
      setLogo(listing.logoUrl)
    }
  }, [listing])

  // Always enable next (logo is optional)
  useEffect(() => {
    enableNext()
  }, [enableNext])

  const handleNext = async () => {
    try {
      if (logo) {
        updateListingData({ logoUrl: logo })
      }
      router.push(`/onboarding/${id}/import`)
    } catch (error) {
      console.error("Error updating branding:", error)
    }
  }

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0]
      const logoUrl = uploadedFile.cdnUrl || uploadedFile.url
      setLogo(logoUrl)
      setShowUploader(false)
      updateListingData({ logoUrl })
    }
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
  }

  const handleRemoveLogo = () => {
    setLogo(undefined)
    updateListingData({ logoUrl: undefined })
  }

  // Set custom navigation
  useEffect(() => {
    setCustomNavigation({
      onNext: handleNext,
    })

    return () => {
      setCustomNavigation(undefined)
    }
  }, [logo])

  return (
    <div className="w-full">
      <FormLayout>
        <FormHeading
          title={dict.schoolBranding || "Upload your school logo"}
          description={
            dict.brandingDescription ||
            "Add your school's logo to personalize your platform. This is optional - you can always add it later."
          }
        />
        <div>
          {!logo && !showUploader ? (
            <div
              onClick={() => setShowUploader(true)}
              className="border-muted-foreground/30 hover:border-muted-foreground/50 flex h-[250px] w-[400px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
            >
              <Upload className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="font-medium">{dict.uploadLogo || "Upload logo"}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {dict.logoFileTypes || "SVG, PNG, JPG"}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                {dict.optional || "(Optional)"}
              </p>
            </div>
          ) : showUploader ? (
            <div className="w-[400px] space-y-4">
              <FileUploader
                category="IMAGE"
                folder="school-logos"
                accept={ACCEPT_IMAGES}
                maxFiles={1}
                multiple={false}
                maxSize={5 * 1024 * 1024}
                optimizeImages={true}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
              <Button
                variant="outline"
                onClick={() => setShowUploader(false)}
                className="w-full"
              >
                {dict.cancel || "Cancel"}
              </Button>
            </div>
          ) : (
            <div className="relative h-[250px] w-[400px] overflow-hidden rounded-lg border">
              {logo && (
                <Image
                  src={logo}
                  alt="School logo"
                  fill
                  className="object-contain p-4"
                />
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemoveLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </FormLayout>
    </div>
  )
}
