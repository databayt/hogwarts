"use client"

import { useCallback, useEffect, useState, useTransition } from "react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { createTemplateFromTerm, getTermsForCopy } from "../actions"

interface Term {
  id: string
  label: string
  startDate: Date
  endDate: Date
}

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  currentTermId: string
  dictionary?: {
    templates?: {
      createTitle?: string
      createDescription?: string
      name?: string
      namePlaceholder?: string
      description?: string
      descriptionPlaceholder?: string
      sourceTerm?: string
      selectTerm?: string
      create?: string
      cancel?: string
    }
  }
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
  currentTermId,
  dictionary,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sourceTermId, setSourceTermId] = useState(currentTermId)
  const [terms, setTerms] = useState<Term[]>([])
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const t = dictionary?.templates || {}

  useEffect(() => {
    if (open) {
      getTermsForCopy().then(setTerms).catch(console.error)
      setSourceTermId(currentTermId)
    }
  }, [open, currentTermId])

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        await createTemplateFromTerm({
          name: name.trim(),
          description: description.trim() || undefined,
          sourceTermId,
        })

        toast({
          title: "Success",
          description: `Template "${name}" created successfully`,
        })

        onOpenChange(false)
        onSuccess()
        setName("")
        setDescription("")
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive",
        })
      }
    })
  }, [name, description, sourceTermId, onOpenChange, onSuccess, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.createTitle || "Create Template"}</DialogTitle>
          <DialogDescription>
            {t.createDescription ||
              "Save the current timetable as a reusable template"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.name || "Template Name"}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder || "e.g., Fall 2024 Schedule"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t.description || "Description (Optional)"}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                t.descriptionPlaceholder ||
                "Brief description of this template..."
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceTerm">{t.sourceTerm || "Source Term"}</Label>
            <Select value={sourceTermId} onValueChange={setSourceTermId}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectTerm || "Select term"} />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Creating..." : t.create || "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
