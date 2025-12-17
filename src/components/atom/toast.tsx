"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ============================================
// Configuration
// ============================================
const CONFIG = {
  position: "bottom-right" as const,
  duration: {
    success: 2000,
    error: 4000,
    info: 3000,
    delete: 2000,
  },
} as const

// ============================================
// Toast Functions
// ============================================
export const SuccessToast = (message: string) => {
  toast.success(message, {
    icon: (
      <div className="bg-chart-2 flex h-8 w-8 items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    ),
    duration: CONFIG.duration.success,
    position: CONFIG.position,
    style: {
      border: "none",
      padding: "0px",
      background: "transparent",
      boxShadow: "none",
      minWidth: "auto",
      minHeight: "auto",
    },
  })
}

export const ErrorToast = (message: string) => {
  toast.error(message, {
    duration: CONFIG.duration.error,
    position: CONFIG.position,
    style: {
      background: "hsl(var(--destructive))",
      color: "hsl(var(--destructive-foreground))",
      border: "none",
      width: "220px",
      maxWidth: "220px",
    },
  })
}

export const InfoToast = (message: string) => {
  toast.info(message, {
    duration: CONFIG.duration.info,
    position: CONFIG.position,
    style: {
      background: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      border: "none",
      width: "220px",
      maxWidth: "220px",
    },
  })
}

export const DeleteToast = (message: string = "Deleted") => {
  toast(message, {
    duration: CONFIG.duration.delete,
    position: CONFIG.position,
    style: {
      background: "hsl(var(--destructive))",
      color: "hsl(var(--destructive-foreground))",
      border: "none",
      width: "220px",
      maxWidth: "220px",
    },
  })
}

// ============================================
// Confirm Dialog (SSR-Safe Implementation)
// ============================================
type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

type ConfirmState = ConfirmOptions & {
  open: boolean
  resolve?: (v: boolean) => void
}

// Global state setter for confirm dialog (lazy initialized)
let setConfirmState: ((state: ConfirmState) => void) | null = null

function ConfirmDialogPortal() {
  const [state, setState] = useState<ConfirmState>({ open: false })

  useEffect(() => {
    setConfirmState = setState
    return () => {
      setConfirmState = null
    }
  }, [])

  const handleClose = () => {
    setState((s) => ({ ...s, open: false }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    handleClose()
  }

  const handleConfirm = () => {
    state.resolve?.(true)
    handleClose()
  }

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title ?? "Are you sure?"}</DialogTitle>
          {state.description && (
            <DialogDescription>{state.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {state.cancelText ?? "Cancel"}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {state.confirmText ?? "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Lazy mount the dialog portal
let portalMounted = false

function ensurePortalMounted() {
  if (typeof window === "undefined" || portalMounted) return

  const id = "__confirm_dialog_root__"
  let container = document.getElementById(id)

  if (!container) {
    container = document.createElement("div")
    container.id = id
    document.body.appendChild(container)

    // Use React 18 createRoot via dynamic import to avoid SSR issues
    import("react-dom/client").then(({ createRoot }) => {
      createRoot(container!).render(<ConfirmDialogPortal />)
    })
  }

  portalMounted = true
}

export function confirmDeleteDialog(message?: string): Promise<boolean> {
  return new Promise((resolve) => {
    ensurePortalMounted()

    // Wait for portal to mount if needed
    const tryOpen = () => {
      if (setConfirmState) {
        setConfirmState({
          open: true,
          title: "Delete item",
          description: message ?? "This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          resolve,
        })
      } else {
        // Retry after a short delay if portal not ready
        setTimeout(tryOpen, 50)
      }
    }

    tryOpen()
  })
}
