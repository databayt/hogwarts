/**
 * Exam Paper Templates
 * Registry of available paper templates
 */

import type { ExamPaperTemplate } from "@prisma/client"

import type { ExamPaperData } from "../types"
import { ClassicTemplate } from "./classic"

// ============================================================================
// Template Registry
// ============================================================================

export interface TemplateComponent {
  component: React.ComponentType<{ data: ExamPaperData; groupByType?: boolean }>
  name: string
  nameAr: string
  description: string
  descriptionAr: string
}

export const TEMPLATE_REGISTRY: Record<ExamPaperTemplate, TemplateComponent> = {
  CLASSIC: {
    component: ClassicTemplate,
    name: "Classic Academic",
    nameAr: "كلاسيكي أكاديمي",
    description:
      "Traditional exam format with school header and numbered questions",
    descriptionAr: "تنسيق الاختبار التقليدي مع رأس المدرسة والأسئلة المرقمة",
  },
  MODERN: {
    component: ClassicTemplate, // TODO: Create Modern template
    name: "Modern Minimal",
    nameAr: "حديث بسيط",
    description: "Clean, spacious layout with minimal decorations",
    descriptionAr: "تخطيط نظيف وواسع مع زخارف قليلة",
  },
  FORMAL: {
    component: ClassicTemplate, // TODO: Create Formal template
    name: "Formal Official",
    nameAr: "رسمي",
    description: "Government exam style with strict formatting and watermarks",
    descriptionAr: "نمط الاختبار الحكومي مع تنسيق صارم وعلامات مائية",
  },
  CUSTOM: {
    component: ClassicTemplate, // Uses school branding
    name: "Custom Branded",
    nameAr: "مخصص",
    description: "Uses school branding colors and custom styling",
    descriptionAr: "يستخدم ألوان العلامة التجارية للمدرسة والتنسيق المخصص",
  },
}

// ============================================================================
// Template Selector
// ============================================================================

/**
 * Get the template component for a given template type
 */
export function getTemplate(
  templateType: ExamPaperTemplate
): TemplateComponent {
  return TEMPLATE_REGISTRY[templateType] || TEMPLATE_REGISTRY.CLASSIC
}

/**
 * Get all available templates
 */
export function getAllTemplates(): Array<{
  id: ExamPaperTemplate
  template: TemplateComponent
}> {
  return (
    Object.entries(TEMPLATE_REGISTRY) as Array<
      [ExamPaperTemplate, TemplateComponent]
    >
  ).map(([id, template]) => ({ id, template }))
}

// ============================================================================
// Exports
// ============================================================================

export { ClassicTemplate } from "./classic"
export * from "./components"
