"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { createCertificateConfig, updateCertificateConfig } from "./actions"

interface Signature {
  name: string
  title: string
  signatureUrl?: string
}

interface ConfigFormProps {
  initialData?: {
    id: string
    name: string
    type: string
    description?: string | null
    templateStyle: string
    orientation: string
    titleText: string
    titleTextAr?: string | null
    bodyTemplate: string
    bodyTemplateAr?: string | null
    minPercentage?: number | null
    minGrade?: string | null
    topPercentile?: number | null
    signatures: Signature[]
    useSchoolLogo: boolean
    customLogo?: string | null
    borderStyle: string
    expiryMonths?: number | null
    enableVerification: boolean
    verificationPrefix?: string | null
  }
}

export function CertificateConfigForm({ initialData }: ConfigFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [signatures, setSignatures] = useState<Signature[]>(
    initialData?.signatures || [{ name: "", title: "" }]
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const data: Record<string, unknown> = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      description: (formData.get("description") as string) || undefined,
      templateStyle: formData.get("templateStyle") as string,
      orientation: formData.get("orientation") as string,
      titleText: formData.get("titleText") as string,
      titleTextAr: (formData.get("titleTextAr") as string) || undefined,
      bodyTemplate: formData.get("bodyTemplate") as string,
      bodyTemplateAr: (formData.get("bodyTemplateAr") as string) || undefined,
      minPercentage: formData.get("minPercentage")
        ? Number(formData.get("minPercentage"))
        : undefined,
      minGrade: (formData.get("minGrade") as string) || undefined,
      topPercentile: formData.get("topPercentile")
        ? Number(formData.get("topPercentile"))
        : undefined,
      signatures: signatures.filter((s) => s.name && s.title),
      useSchoolLogo: formData.get("useSchoolLogo") === "on",
      borderStyle: formData.get("borderStyle") as string,
      expiryMonths: formData.get("expiryMonths")
        ? Number(formData.get("expiryMonths"))
        : undefined,
      enableVerification: formData.get("enableVerification") === "on",
      verificationPrefix:
        (formData.get("verificationPrefix") as string) || undefined,
    }

    let result
    if (initialData?.id) {
      result = await updateCertificateConfig({ id: initialData.id, ...data })
    } else {
      result = await createCertificateConfig(data)
    }

    setLoading(false)

    if (result.success) {
      toast({
        title: initialData ? "Template updated" : "Template created",
      })
      router.back()
    } else if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  function addSignature() {
    setSignatures([...signatures, { name: "", title: "" }])
  }

  function removeSignature(index: number) {
    setSignatures(signatures.filter((_, i) => i !== index))
  }

  function updateSignature(
    index: number,
    field: keyof Signature,
    value: string
  ) {
    const updated = [...signatures]
    updated[index] = { ...updated[index], [field]: value }
    setSignatures(updated)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={initialData?.name}
            placeholder="e.g., Excellence Certificate"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Certificate Type</Label>
          <Select name="type" defaultValue={initialData?.type || "ACHIEVEMENT"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
              <SelectItem value="COMPLETION">Completion</SelectItem>
              <SelectItem value="PARTICIPATION">Participation</SelectItem>
              <SelectItem value="MERIT">Merit (Top 10%)</SelectItem>
              <SelectItem value="EXCELLENCE">Excellence (Top 3%)</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description || ""}
          placeholder="Optional description of this template"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="templateStyle">Style</Label>
          <Select
            name="templateStyle"
            defaultValue={initialData?.templateStyle || "elegant"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elegant">Elegant</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orientation">Orientation</Label>
          <Select
            name="orientation"
            defaultValue={initialData?.orientation || "landscape"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="borderStyle">Border Style</Label>
          <Select
            name="borderStyle"
            defaultValue={initialData?.borderStyle || "gold"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titleText">Title Text (English)</Label>
          <Input
            id="titleText"
            name="titleText"
            defaultValue={
              initialData?.titleText || "Certificate of Achievement"
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="titleTextAr">Title Text (Arabic)</Label>
          <Input
            id="titleTextAr"
            name="titleTextAr"
            dir="rtl"
            defaultValue={initialData?.titleTextAr || ""}
            placeholder="شهادة تقدير"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyTemplate">Body Template (English)</Label>
        <Textarea
          id="bodyTemplate"
          name="bodyTemplate"
          required
          rows={4}
          defaultValue={
            initialData?.bodyTemplate ||
            "This is to certify that {{studentName}} has achieved a score of {{score}}% in {{examTitle}} on {{examDate}}."
          }
          placeholder="Use placeholders: {{studentName}}, {{score}}, {{grade}}, {{examTitle}}, {{examDate}}, {{rank}}"
        />
        <p className="text-muted-foreground text-xs">
          Available placeholders: {"{{studentName}}"}, {"{{score}}"},
          {"{{grade}}"}, {"{{examTitle}}"}, {"{{examDate}}"}, {"{{rank}}"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyTemplateAr">Body Template (Arabic)</Label>
        <Textarea
          id="bodyTemplateAr"
          name="bodyTemplateAr"
          dir="rtl"
          rows={4}
          defaultValue={initialData?.bodyTemplateAr || ""}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="minPercentage">Minimum Percentage</Label>
          <Input
            id="minPercentage"
            name="minPercentage"
            type="number"
            min={0}
            max={100}
            defaultValue={initialData?.minPercentage ?? ""}
            placeholder="e.g., 80"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minGrade">Minimum Grade</Label>
          <Input
            id="minGrade"
            name="minGrade"
            defaultValue={initialData?.minGrade || ""}
            placeholder="e.g., B"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topPercentile">Top Percentile (%)</Label>
          <Input
            id="topPercentile"
            name="topPercentile"
            type="number"
            min={0}
            max={100}
            defaultValue={initialData?.topPercentile ?? ""}
            placeholder="e.g., 10"
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <Label>Signatures</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSignature}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Signature
          </Button>
        </div>
        <div className="space-y-4">
          {signatures.map((sig, i) => (
            <div key={i} className="flex gap-4">
              <Input
                placeholder="Name"
                value={sig.name}
                onChange={(e) => updateSignature(i, "name", e.target.value)}
              />
              <Input
                placeholder="Title"
                value={sig.title}
                onChange={(e) => updateSignature(i, "title", e.target.value)}
              />
              {signatures.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSignature(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="useSchoolLogo"
            name="useSchoolLogo"
            defaultChecked={initialData?.useSchoolLogo ?? true}
          />
          <Label htmlFor="useSchoolLogo">Use School Logo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="enableVerification"
            name="enableVerification"
            defaultChecked={initialData?.enableVerification ?? true}
          />
          <Label htmlFor="enableVerification">Enable Verification</Label>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="verificationPrefix">Verification Prefix</Label>
          <Input
            id="verificationPrefix"
            name="verificationPrefix"
            defaultValue={initialData?.verificationPrefix || ""}
            placeholder="e.g., CERT-"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryMonths">Expiry (months)</Label>
          <Input
            id="expiryMonths"
            name="expiryMonths"
            type="number"
            min={1}
            defaultValue={initialData?.expiryMonths ?? ""}
            placeholder="Leave empty for permanent"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : initialData
              ? "Update Template"
              : "Create Template"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default CertificateConfigForm
