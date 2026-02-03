/**
 * Custom React hooks for Invoice components
 *
 * Reusable hooks for invoice management and state handling.
 */

import { useCallback, useEffect, useState } from "react"

/**
 * Hook for managing invoice form state
 */
export function useInvoiceForm(initialData?: Partial<InvoiceFormData>) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientName: initialData?.clientName || "",
    clientEmail: initialData?.clientEmail || "",
    items: initialData?.items || [],
    taxRate: initialData?.taxRate || 0,
    discountRate: initialData?.discountRate || 0,
    notes: initialData?.notes || "",
    dueDate: initialData?.dueDate || new Date(),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = useCallback(
    (field: keyof InvoiceFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear error for this field when updated
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    },
    []
  )

  const reset = useCallback(() => {
    setFormData({
      clientName: "",
      clientEmail: "",
      items: [],
      taxRate: 0,
      discountRate: 0,
      notes: "",
      dueDate: new Date(),
    })
    setErrors({})
  }, [])

  return {
    formData,
    errors,
    updateField,
    setFormData,
    setErrors,
    reset,
  }
}

/**
 * Hook for managing invoice calculations
 */
export function useInvoiceCalculations(
  items: InvoiceItem[],
  taxRate: number,
  discountRate: number
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  )
  const discountAmount = subtotal * (discountRate / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (taxRate / 100)
  const total = taxableAmount + taxAmount

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  }
}

/**
 * Hook for invoice status management
 */
export function useInvoiceStatus(initialStatus: InvoiceStatus = "draft") {
  const [status, setStatus] = useState<InvoiceStatus>(initialStatus)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const transitionTo = useCallback(
    async (newStatus: InvoiceStatus, onTransition?: () => Promise<void>) => {
      setIsTransitioning(true)
      try {
        if (onTransition) {
          await onTransition()
        }
        setStatus(newStatus)
      } catch (error) {
        console.error("Status transition failed:", error)
        throw error
      } finally {
        setIsTransitioning(false)
      }
    },
    []
  )

  const canTransitionTo = useCallback(
    (targetStatus: InvoiceStatus): boolean => {
      const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
        draft: ["pending", "void"],
        pending: ["sent", "void"],
        sent: ["paid", "overdue", "void"],
        overdue: ["paid", "void"],
        paid: [],
        void: [],
      }

      return allowedTransitions[status]?.includes(targetStatus) || false
    },
    [status]
  )

  return {
    status,
    isTransitioning,
    transitionTo,
    canTransitionTo,
  }
}

/**
 * Hook for auto-saving invoice drafts
 */
export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay = 2000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data) {
        setIsSaving(true)
        try {
          await onSave(data)
          setLastSaved(new Date())
        } catch (error) {
          console.error("Auto-save failed:", error)
        } finally {
          setIsSaving(false)
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [data, onSave, delay])

  return {
    isSaving,
    lastSaved,
  }
}

/**
 * Hook for managing invoice filters
 */
export function useInvoiceFilters() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: "",
    clientName: "",
    dateFrom: undefined,
    dateTo: undefined,
  })

  const updateFilter = useCallback(
    (key: keyof InvoiceFilters, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({
      status: "",
      clientName: "",
      dateFrom: undefined,
      dateTo: undefined,
    })
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
  }
}

// Types
type InvoiceStatus = "draft" | "pending" | "sent" | "overdue" | "paid" | "void"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface InvoiceFormData {
  clientName: string
  clientEmail: string
  items: InvoiceItem[]
  taxRate: number
  discountRate: number
  notes: string
  dueDate: Date
}

interface InvoiceFilters {
  status: string
  clientName: string
  dateFrom?: Date
  dateTo?: Date
}
