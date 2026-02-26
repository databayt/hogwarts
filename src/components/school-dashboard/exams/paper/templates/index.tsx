// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Templates
 * Registry of available paper templates
 */

import type { ExamPaperTemplate } from "@prisma/client"

import type { ExamPaperData } from "../types"
import { ClassicTemplate } from "./classic"
import { CustomTemplate } from "./custom"
import { FormalTemplate } from "./formal"
import { ModernTemplate } from "./modern"

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
    component: ModernTemplate,
    name: "حديث بسيط",
    description: "تخطيط نظيف وواسع مع زخارف قليلة",
  },
  FORMAL: {
    component: FormalTemplate,
    name: "رسمي",
    description: "نمط الاختبار الحكومي مع تنسيق صارم وعلامات مائية",
  },
  CUSTOM: {
    component: CustomTemplate,
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
export { CustomTemplate } from "./custom"
export { FormalTemplate } from "./formal"
export { ModernTemplate } from "./modern"
export * from "./components"
