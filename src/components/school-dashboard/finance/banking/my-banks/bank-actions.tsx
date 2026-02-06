"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVertical, LoaderCircle, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { removeBank, syncBankData } from "./actions"

interface Props {
  accountId: string
  accountName: string
  dictionary: any
}

export default function BankActions(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncBankData({ accountId: props.accountId })
      if (result.success) {
        toast.success(
          props.dictionary.syncSuccess || "Bank data synced successfully"
        )
        router.refresh()
      } else {
        toast.error(result.error?.message || "Failed to sync bank data")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await removeBank({ accountId: props.accountId })
      if (result.success) {
        toast.success(
          props.dictionary.removeSuccess || "Bank account removed successfully"
        )
        router.refresh()
      } else {
        toast.error(result.error?.message || "Failed to remove bank account")
      }
      setShowDeleteDialog(false)
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <EllipsisVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSync} disabled={isPending}>
            <RefreshCw className="me-2 h-4 w-4" />
            {props.dictionary.syncData || "Sync Data"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            className="text-destructive"
          >
            <Trash2 className="me-2 h-4 w-4" />
            {props.dictionary.remove || "Remove"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {props.dictionary.confirmRemove || "Remove Bank Account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {props.dictionary.removeDescription ||
                `Are you sure you want to remove ${props.accountName}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {props.dictionary.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? (
                <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              {props.dictionary.remove || "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
