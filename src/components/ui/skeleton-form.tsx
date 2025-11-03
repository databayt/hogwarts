import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * SkeletonForm Component
 *
 * Skeleton for form layouts with labels, inputs, and submit button.
 * Used in profile pages, settings, and modal forms.
 *
 * Pattern matches:
 * - Form fields with labels
 * - Text inputs, selects, textareas
 * - Submit button at bottom
 *
 * @example
 * ```tsx
 * // Default form (6 fields)
 * <SkeletonForm />
 *
 * // Custom field count
 * <SkeletonForm fields={10} />
 * ```
 */
interface SkeletonFormProps {
  /** Number of form fields (default: 6) */
  fields?: number
  /** Show form wrapped in Card (default: false) */
  showCard?: boolean
  /** Additional CSS classes */
  className?: string
}

export function SkeletonForm({
  fields = 6,
  showCard = false,
  className,
}: SkeletonFormProps) {
  const FormContent = (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Field label */}
          <Skeleton className="h-4 w-24" />
          {/* Field input */}
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {/* Submit button */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>{FormContent}</CardContent>
      </Card>
    )
  }

  return FormContent
}

/**
 * SkeletonFormGrid Component
 *
 * Two-column grid form layout for complex forms.
 *
 * @example
 * ```tsx
 * <SkeletonFormGrid fields={12} />
 * ```
 */
export function SkeletonFormGrid({
  fields = 8,
  className,
}: Omit<SkeletonFormProps, "showCard">) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * SkeletonFormSection Component
 *
 * Form section with heading and fields (used in settings pages).
 *
 * @example
 * ```tsx
 * <SkeletonFormSection fields={4} />
 * ```
 */
export function SkeletonFormSection({
  fields = 4,
  className,
}: Omit<SkeletonFormProps, "showCard">) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Section heading */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
