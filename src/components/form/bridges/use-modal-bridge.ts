"use client"

/**
 * Modal Context Bridge
 *
 * Bridges Form Block with useModal context for CRUD modal forms.
 * Provides unified interface for modal state and form integration.
 *
 * **Role**: Bridge hook for CRUD modals → Form Block integration
 *
 * **Usage**:
 * - Use in CRUD form components
 * - Provides modal open/close state
 * - Integrates with ModalMultiStepForm
 *
 * @example
 * ```tsx
 * function ClassCreateForm() {
 *   const bridge = useModalBridge()
 *
 *   return (
 *     <ModalMultiStepForm
 *       config={formConfig}
 *       open={bridge.isOpen}
 *       onOpenChange={(open) => !open && bridge.close()}
 *       onComplete={handleSubmit}
 *       defaultValues={bridge.mode === "edit" ? existingData : {}}
 *     >
 *       <FormStepContainer>...</FormStepContainer>
 *     </ModalMultiStepForm>
 *   )
 * }
 * ```
 */
import { useCallback, useMemo } from "react"

import { useModal } from "@/components/atom/modal/context"

import { useMultiStepFormOptional } from "../template/provider"

/** Modal mode for CRUD operations */
export type ModalMode = "create" | "edit" | "view" | "delete"

interface UseModalBridgeOptions {
  /** Determine mode from modal id (default: create if no id, edit otherwise) */
  determineMode?: (id: string | null) => ModalMode
}

interface UseModalBridgeReturn {
  /** Whether the modal is open */
  isOpen: boolean
  /** The current entity ID (null for create) */
  currentId: string | null
  /** The modal mode (create, edit, view, delete) */
  mode: ModalMode
  /** Open the modal */
  open: (id?: string | null) => void
  /** Close the modal */
  close: () => void
  /** Reset form and close modal */
  resetAndClose: () => void
  /** Get all form data from Form Block */
  getFormData: () => Record<string, unknown>
  /** Check if Form Block is available */
  hasFormBlock: boolean
}

export function useModalBridge(
  options: UseModalBridgeOptions = {}
): UseModalBridgeReturn {
  const { determineMode } = options

  const { modal, openModal, closeModal } = useModal()
  const multiStep = useMultiStepFormOptional()

  // Determine mode from id
  const mode = useMemo<ModalMode>(() => {
    if (determineMode) {
      return determineMode(modal.id)
    }
    // Default: create if no id, edit otherwise
    return modal.id ? "edit" : "create"
  }, [modal.id, determineMode])

  // Open modal
  const open = useCallback(
    (id?: string | null) => {
      openModal(id)
    },
    [openModal]
  )

  // Close modal
  const close = useCallback(() => {
    closeModal()
  }, [closeModal])

  // Reset form and close modal
  const resetAndClose = useCallback(() => {
    if (multiStep) {
      multiStep.reset()
    }
    closeModal()
  }, [multiStep, closeModal])

  // Get all form data from Form Block context
  const getFormData = useCallback(() => {
    if (!multiStep) return {}
    return multiStep.getAllData()
  }, [multiStep])

  return {
    isOpen: modal.open,
    currentId: modal.id,
    mode,
    open,
    close,
    resetAndClose,
    getFormData,
    hasFormBlock: multiStep !== null,
  }
}
