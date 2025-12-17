"use client"

/**
 * Compatibility shim for shadcn/ui toast API
 * Maps to sonner under the hood
 */
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

/**
 * Compatibility wrapper - maps shadcn toast({ title, description }) to sonner
 */
export function toast(props: ToastProps) {
  const { title, description, variant } = props
  const message = description || title || ""

  if (variant === "destructive" || title?.toLowerCase().includes("error")) {
    return sonnerToast.error(message)
  }

  if (title?.toLowerCase().includes("success")) {
    return sonnerToast.success(message)
  }

  return sonnerToast(message)
}

/**
 * Hook for compatibility - returns toast function
 * @deprecated Use `import { toast } from "sonner"` directly
 */
export function useToast() {
  return {
    toast,
    toasts: [] as ToastProps[],
    dismiss: (id?: string) => sonnerToast.dismiss(id),
  }
}
