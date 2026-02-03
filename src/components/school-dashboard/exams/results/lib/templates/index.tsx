// PDF Templates Registry

import React from "react"

import type { PDFResultData, PDFTemplate } from "../../types"
import { ClassicTemplate } from "./classic"
import { MinimalTemplate } from "./minimal"
import { ModernTemplate } from "./modern"

export { ClassicTemplate, ModernTemplate, MinimalTemplate }

/**
 * Get template component by name
 */
export function getTemplate(template: PDFTemplate) {
  const templates = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    minimal: MinimalTemplate,
  }

  return templates[template]
}

/**
 * Render template with data
 */
export function renderTemplate(
  template: PDFTemplate,
  data: PDFResultData
): React.ReactElement {
  const TemplateComponent = getTemplate(template)
  return React.createElement(TemplateComponent, { data })
}

/**
 * Get all available templates with metadata
 */
export function getAllTemplates() {
  return [
    {
      id: "classic" as const,
      name: "Classic",
      description: "Traditional report card with formal layout",
      features: [
        "Formal design",
        "Detailed question breakdown",
        "Signature sections",
        "School branding support",
      ],
      bestFor: "Official transcripts and certificates",
    },
    {
      id: "modern" as const,
      name: "Modern",
      description: "Visual design with charts and progress indicators",
      features: [
        "Colorful design",
        "Progress visualizations",
        "Class analytics",
        "Performance metrics",
      ],
      bestFor: "Student engagement and parent communication",
    },
    {
      id: "minimal" as const,
      name: "Minimal",
      description: "Clean and simple text-based layout",
      features: [
        "Clean typography",
        "Essential information only",
        "Easy to read",
        "Print-friendly",
      ],
      bestFor: "Quick reports and internal use",
    },
  ]
}

/**
 * Get template preview image URL
 */
export function getTemplatePreview(template: PDFTemplate): string {
  const previews = {
    classic: "/templates/classic-preview.png",
    modern: "/templates/modern-preview.png",
    minimal: "/templates/minimal-preview.png",
  }

  return previews[template]
}
