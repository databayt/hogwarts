// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Templates
 * Registry of available paper templates
 */

import type { ExamPaperTemplate } from "@prisma/client"

import { ComposableDocument } from "../../templates/composable"
import type { ExamPaperData } from "../types"

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
    component: ComposableDocument,
    name: "كلاسيكي أكاديمي",
    description: "تنسيق الاختبار التقليدي مع رأس المدرسة والأسئلة المرقمة",
  },
  MODERN: {
    component: ComposableDocument,
    name: "حديث بسيط",
    description: "تخطيط نظيف وواسع مع زخارف قليلة",
  },
  FORMAL: {
    component: ComposableDocument,
    name: "رسمي",
    description: "نمط الاختبار الحكومي مع تنسيق صارم وعلامات مائية",
  },
  CUSTOM: {
    component: ComposableDocument,
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

export { ComposableDocument } from "../../templates/composable"
/** @deprecated Use ComposableDocument instead */
export {
  ClassicTemplate,
  CustomTemplate,
  FormalTemplate,
  ModernTemplate,
} from "../../templates"
export * from "./components"
