"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  confirmLinkChild,
  getGuardianTypesForLink,
  validateLinkCode,
} from "./link-child-actions"

type Step = "enter-code" | "confirm" | "success"

interface GuardianType {
  id: string
  name: string
}

interface LinkChildDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LinkChildDialog({
  open,
  onOpenChange,
  onSuccess,
}: LinkChildDialogProps) {
  const [step, setStep] = useState<Step>("enter-code")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [guardianTypes, setGuardianTypes] = useState<GuardianType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState("")

  // Load guardian types when dialog opens
  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const result = await getGuardianTypesForLink()
        if (result.success && result.data) {
          setGuardianTypes(result.data)
          if (result.data.length > 0) {
            setSelectedTypeId(result.data[0].id)
          }
        }
      })
    }
  }, [open])

  const handleReset = useCallback(() => {
    setStep("enter-code")
    setCode("")
    setError(null)
    setStudentName("")
    setStudentId("")
    setSelectedTypeId(guardianTypes[0]?.id || "")
  }, [guardianTypes])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleReset()
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, handleReset]
  )

  const handleValidate = useCallback(() => {
    setError(null)
    startTransition(async () => {
      const result = await validateLinkCode({ code: code.trim() })
      if (result.success && result.data) {
        setStudentName(result.data.studentName)
        setStudentId(result.data.studentId)
        setStep("confirm")
      } else {
        setError("error" in result ? result.error : "Invalid code")
      }
    })
  }, [code])

  const handleConfirm = useCallback(() => {
    setError(null)
    startTransition(async () => {
      const result = await confirmLinkChild({
        code: code.trim(),
        guardianTypeId: selectedTypeId,
      })
      if (result.success) {
        setStep("success")
        onSuccess?.()
      } else {
        setError("error" in result ? result.error : "Failed to link child")
      }
    })
  }, [code, selectedTypeId, onSuccess])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Child</DialogTitle>
          <DialogDescription>
            Enter the access code provided by the school to link your account to
            your child&apos;s profile.
          </DialogDescription>
        </DialogHeader>

        {step === "enter-code" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Access Code</Label>
              <Input
                id="access-code"
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center font-mono text-lg tracking-wider"
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={handleValidate}
                disabled={isPending || code.trim().length === 0}
              >
                {isPending ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Code"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Student found:</p>
              <p className="text-lg font-semibold">{studentName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardian-type">Your relationship</Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger id="guardian-type">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {guardianTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isPending || !selectedTypeId}
              >
                {isPending ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Confirm Link"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center text-lg font-semibold">
                Successfully linked!
              </p>
              <p className="text-muted-foreground text-center text-sm">
                You are now linked to {studentName}&apos;s profile.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
