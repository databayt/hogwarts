"use client"

import React from "react"

interface ModalFormLayoutProps {
  /** Modal title (e.g., "Create Student", "Edit Announcement") */
  title: string
  /** Modal description explaining the action */
  description: string
  /** Form content (fields, steps, etc.) */
  children: React.ReactNode
}

/**
 * ModalFormLayout provides a consistent two-column layout for modal forms.
 *
 * Following the onboarding pattern:
 * - Left column: Title + Description (styled prominently)
 * - Right column: Form content
 * - Vertically centered within the modal
 * - Responsive: stacks on mobile, side-by-side on desktop
 *
 * @example
 * ```tsx
 * <ModalFormLayout
 *   title="Create Student"
 *   description="Add a new student to your school"
 * >
 *   <Form>
 *     {/* form fields *\/}
 *   </Form>
 * </ModalFormLayout>
 * ```
 */
export function ModalFormLayout({
  title,
  description,
  children,
}: ModalFormLayoutProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
        {/* LEFT: Title + Description */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        </div>

        {/* RIGHT: Form Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

export default ModalFormLayout
