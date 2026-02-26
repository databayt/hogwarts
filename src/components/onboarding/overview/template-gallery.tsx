"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import { BookOpen, Globe, GraduationCap, School } from "lucide-react"

import { cn } from "@/lib/utils"

import { SCHOOL_TEMPLATES } from "../config"

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  elementary: School,
  "high-school": GraduationCap,
  "private-academy": BookOpen,
  international: Globe,
}

interface TemplateGalleryProps {
  onSelect: (templateId: string) => void
  selectedId?: string
  dictionary?: any
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelect,
  selectedId,
  dictionary,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">
          {dictionary?.chooseTemplate || "Choose a template"}
        </h4>
        <p className="muted mt-1">
          {dictionary?.chooseTemplateDescription ||
            "Select a pre-configured template to get started quickly"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SCHOOL_TEMPLATES.map((template) => {
          const Icon = TEMPLATE_ICONS[template.id] || School
          const isSelected = selectedId === template.id

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                "border-border hover:border-foreground/30 flex items-start gap-3 rounded-lg border p-3 text-start transition-all sm:p-4",
                isSelected && "border-foreground ring-foreground/20 ring-2"
              )}
            >
              <div
                className={cn(
                  "bg-muted flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                  isSelected && "bg-foreground/10"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-medium">{template.name}</h5>
                <p className="muted mt-0.5">{template.description}</p>
                <div className="muted mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{template.data.maxStudents} students</span>
                  <span>{template.data.maxTeachers} teachers</span>
                  <span>{template.data.maxClasses} classes</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TemplateGallery
