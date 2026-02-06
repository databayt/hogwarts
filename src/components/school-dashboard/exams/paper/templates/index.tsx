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
  description: string
}

export const TEMPLATE_REGISTRY: Record<ExamPaperTemplate, TemplateComponent> = {
  CLASSIC: {
    component: ClassicTemplate,
    name: "كلاسيكي أكاديمي",
    description: "تنسيق الاختبار التقليدي مع رأس المدرسة والأسئلة المرقمة",
  },
  MODERN: {
    component: ClassicTemplate, // TODO: Create Modern template
    name: "حديث بسيط",
    description: "تخطيط نظيف وواسع مع زخارف قليلة",
  },
  FORMAL: {
    component: ClassicTemplate, // TODO: Create Formal template
    name: "رسمي",
    description: "نمط الاختبار الحكومي مع تنسيق صارم وعلامات مائية",
  },
  CUSTOM: {
    component: ClassicTemplate, // Uses school branding
    name: "مخصص",
    description: "يستخدم ألوان العلامة التجارية للمدرسة والتنسيق المخصص",
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
