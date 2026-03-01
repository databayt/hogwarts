"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file/upload/file-uploader"
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
            "Add your school's logo to personalize your school-dashboard. This is optional - you can always add it later."
          }
        />
        <div className="h-[300px]">
          {!logo ? (
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
              className="h-full [&>div]:h-full"
            />
          ) : (
            <div className="relative h-full overflow-hidden rounded-lg border">
              <Image
                src={logo}
                alt="School logo"
                fill
                className="object-contain p-8"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute end-2 top-2"
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
