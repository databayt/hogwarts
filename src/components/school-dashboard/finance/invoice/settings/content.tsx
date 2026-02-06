"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import {
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

type TSignatureData = {
  name: string
  image: string
}

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function SettingsContent({ dictionary, lang }: Props) {
  const [logo, setLogo] = useState<string>("")
  const [signatureData, setSignatureData] = useState<TSignatureData>({
    name: "",
    image: "",
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showLogoUploader, setShowLogoUploader] = useState(false)
  const [showSignatureUploader, setShowSignatureUploader] = useState(false)
  const router = useRouter()

  //handle on change signature name
  const onChangeSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setSignatureData((preve) => {
      return {
        ...preve,
        [name]: value,
      }
    })
  }

  // Handle logo upload completion
  const handleLogoUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const url = files[0].cdnUrl || files[0].url
      setLogo(url)
      setShowLogoUploader(false)
      toast.success("Logo uploaded successfully")
    }
  }

  const handleLogoUploadError = (error: string) => {
    toast.error(error)
  }

  // Handle signature image upload completion
  const handleSignatureUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const url = files[0].cdnUrl || files[0].url
      setSignatureData((prev) => ({
        ...prev,
        image: url,
      }))
      setShowSignatureUploader(false)
      toast.success("Signature uploaded successfully")
    }
  }

  const handleSignatureUploadError = (error: string) => {
    toast.error(error)
  }

  const fetchData = async () => {
    try {
      const response = await fetch("/api/settings")
      const responseData = await response.json()

      if (response.status === 200) {
        setLogo(responseData?.data?.invoiceLogo)
        setSignatureData(
          responseData?.data?.signature || { name: "", image: "" }
        )
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    data: any
  ) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings", {
        method: "post",
        body: JSON.stringify(data),
      })

      if (response.status === 200) {
        SuccessToast("Settings saved successfully")
        fetchData()
      }
    } catch (error) {
      ErrorToast("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div>
      <Accordion type="single">
        {/**Invoice Logo */}
        <AccordionItem value="Invoice-Logo">
          <AccordionTrigger className="cursor-pointer text-base font-semibold">
            Invoice Logo
          </AccordionTrigger>
          <AccordionContent>
            <form
              className="grid w-full gap-4"
              onSubmit={(e) => handleSubmit(e, { logo })}
            >
              <div className="w-full max-w-xs">
                {logo ? (
                  <div className="relative">
                    <Image
                      className="aspect-video h-20 max-h-20 rounded-lg border-2 border-dotted object-scale-down"
                      src={logo}
                      width={250}
                      height={96}
                      alt="Invoice logo"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setLogo("")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex aspect-video h-20 items-center justify-center rounded-lg border-2 border-dotted">
                    <p className="text-muted-foreground text-center">No Logo</p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => setShowLogoUploader(true)}
                disabled={isLoading}
              >
                <Upload className="me-2 h-4 w-4" />
                {logo ? "Change Logo" : "Upload Logo"}
              </Button>
              <Button className="w-fit" disabled={isLoading || !logo}>
                {isLoading ? "Please wait..." : "Save"}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/***Signature in invoice */}
        <AccordionItem value="Signature-invoice">
          <AccordionTrigger className="cursor-pointer text-base font-semibold">
            Invoice Signature
          </AccordionTrigger>
          <AccordionContent>
            <form
              className="grid w-full gap-4"
              onSubmit={(e) => handleSubmit(e, { signature: signatureData })}
            >
              <Input
                type="text"
                placeholder="Enter your signature name"
                value={signatureData.name}
                onChange={onChangeSignature}
                name="name"
                disabled={isLoading}
              />
              <div className="w-full max-w-xs">
                {signatureData.image ? (
                  <div className="relative">
                    <Image
                      className="aspect-video h-20 max-h-20 rounded-lg border-2 border-dotted object-scale-down"
                      src={signatureData.image}
                      width={250}
                      height={96}
                      alt="Signature sign"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() =>
                        setSignatureData((prev) => ({ ...prev, image: "" }))
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex aspect-video h-20 items-center justify-center rounded-lg border-2 border-dotted">
                    <p className="text-muted-foreground text-center">
                      No Signature
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => setShowSignatureUploader(true)}
                disabled={isLoading}
              >
                <Upload className="me-2 h-4 w-4" />
                {signatureData.image ? "Change Signature" : "Upload Signature"}
              </Button>
              <Button
                className="w-fit"
                disabled={
                  isLoading || !signatureData.image || !signatureData.name
                }
              >
                {isLoading ? "Please wait..." : "Save"}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Logo Upload Dialog */}
      <Dialog open={showLogoUploader} onOpenChange={setShowLogoUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Invoice Logo</DialogTitle>
          </DialogHeader>
          <FileUploader
            category="IMAGE"
            folder="finance/invoice-logos"
            accept={ACCEPT_IMAGES}
            maxFiles={1}
            multiple={false}
            maxSize={5 * 1024 * 1024} // 5MB
            optimizeImages={true}
            onUploadComplete={handleLogoUploadComplete}
            onUploadError={handleLogoUploadError}
          />
        </DialogContent>
      </Dialog>

      {/* Signature Upload Dialog */}
      <Dialog
        open={showSignatureUploader}
        onOpenChange={setShowSignatureUploader}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Signature</DialogTitle>
          </DialogHeader>
          <FileUploader
            category="IMAGE"
            folder="finance/signatures"
            accept={ACCEPT_IMAGES}
            maxFiles={1}
            multiple={false}
            maxSize={2 * 1024 * 1024} // 2MB
            optimizeImages={true}
            onUploadComplete={handleSignatureUploadComplete}
            onUploadError={handleSignatureUploadError}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
