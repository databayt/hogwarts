"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

import { getAllSubjects } from "./fallback-data"

interface SubjectSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSubject: string
  onSubjectChange: (subject: string) => void
  showAllSubjects?: boolean
  availableSubjects?: string[]
}

export function SubjectSelector({
  open,
  onOpenChange,
  currentSubject,
  onSubjectChange,
  showAllSubjects = false,
  availableSubjects = [],
}: SubjectSelectorProps) {
  const [selectedSubject, setSelectedSubject] = useState(currentSubject)
  const [customSubject, setCustomSubject] = useState("")
  const [useCustomSubject, setUseCustomSubject] = useState(false)

  useEffect(() => {
    setSelectedSubject(currentSubject)
    setCustomSubject(currentSubject)
    setUseCustomSubject(false)
  }, [currentSubject, open])

  const handleSave = () => {
    const finalSubject = useCustomSubject ? customSubject : selectedSubject
    onSubjectChange(finalSubject)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedSubject(currentSubject)
    setCustomSubject(currentSubject)
    setUseCustomSubject(false)
    onOpenChange(false)
  }

  // Get all available subjects based on configuration
  const allSubjects = showAllSubjects ? getAllSubjects() : availableSubjects
  const uniqueSubjects = [...new Set([...allSubjects, ...availableSubjects])]
    .filter(Boolean)
    .sort()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pencil Subject</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Select from available subjects</Label>
            <Select
              value={selectedSubject}
              onValueChange={(value) => {
                setSelectedSubject(value)
                setUseCustomSubject(false)
              }}
              disabled={useCustomSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {uniqueSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomSubject"
                checked={useCustomSubject}
                onChange={(e) => setUseCustomSubject(e.target.checked)}
                className="border-border bg-background text-primary focus:ring-primary h-4 w-4 rounded"
              />
              <Label htmlFor="useCustomSubject">Use custom subject name</Label>
            </div>

            {useCustomSubject && (
              <Input
                placeholder="Enter custom subject name"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {showAllSubjects && (
            <div className="muted dark:text-neutral-400">
              <p>• All subjects are shown in the dropdown</p>
              <p>• You can also enter a custom subject name</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={useCustomSubject && !customSubject.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
