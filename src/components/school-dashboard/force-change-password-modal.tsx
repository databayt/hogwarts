"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ChangePasswordForm } from "./settings/password/form"

interface ForceChangePasswordModalProps {
  hasPassword: boolean
}

export function ForceChangePasswordModal({
  hasPassword,
}: ForceChangePasswordModalProps) {
  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Password Change Required</DialogTitle>
          <DialogDescription>
            Your administrator has required you to change your password before
            continuing. Please set a new password below.
          </DialogDescription>
        </DialogHeader>
        <ChangePasswordForm
          hasPassword={hasPassword}
          onSuccess={() => {
            // Reload the page to clear the modal and refresh session state
            window.location.reload()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
