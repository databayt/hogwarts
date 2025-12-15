import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/atom/modal"
import { UserAvatar } from "@/components/marketing/pricing/shared/user-avatar"
import { deleteCurrentUser } from "@/components/platform/finance/invoice/actions/user"

function DeleteAccountModal({
  showDeleteAccountModal,
  setShowDeleteAccountModal,
}: {
  showDeleteAccountModal: boolean
  setShowDeleteAccountModal: Dispatch<SetStateAction<boolean>>
}) {
  const { data: session } = useSession()
  const [deleting, setDeleting] = useState(false)

  async function deleteAccount() {
    setDeleting(true)
    const result = await deleteCurrentUser()
    if (result.success) {
      await new Promise((resolve) =>
        setTimeout(() => {
          signOut({ callbackUrl: `${window.location.origin}/` })
          resolve(null)
        }, 500)
      )
    } else {
      setDeleting(false)
      throw result.error || "Failed to delete account"
    }
  }

  return (
    <Modal
      showModal={showDeleteAccountModal}
      setShowModal={setShowDeleteAccountModal}
      className="gap-0"
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b p-4 pt-8 sm:px-16">
        <UserAvatar
          user={{
            username:
              (session?.user as any)?.username ?? session?.user?.name ?? null,
            image: session?.user?.image || null,
          }}
        />
        <h3>Delete Account</h3>
        <p className="muted text-muted-foreground text-center">
          <b>Warning:</b> This will permanently delete your account and your
          active subscription!
        </p>

        {/* TODO: Use getUserSubscriptionPlan(session.user.id) to display the user's subscription if he have a paid plan */}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          toast.promise(deleteAccount(), {
            loading: "Deleting account...",
            success: "Account deleted successfully!",
            error: (err) => err,
          })
        }}
        className="bg-accent flex flex-col space-y-6 px-4 py-8 text-left sm:px-16"
      >
        <div>
          <label htmlFor="verification" className="muted block">
            To verify, type{" "}
            <span className="text-black dark:text-white">
              confirm delete account
            </span>{" "}
            below
          </label>
          <Input
            type="text"
            name="verification"
            id="verification"
            pattern="confirm delete account"
            required
            autoFocus={false}
            autoComplete="off"
            className="bg-background mt-1 w-full border"
          />
        </div>

        <Button variant="destructive" disabled={deleting}>
          Confirm delete account
        </Button>
      </form>
    </Modal>
  )
}

export function useDeleteAccountModal() {
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)

  const DeleteAccountModalCallback = useCallback(() => {
    return (
      <DeleteAccountModal
        showDeleteAccountModal={showDeleteAccountModal}
        setShowDeleteAccountModal={setShowDeleteAccountModal}
      />
    )
  }, [showDeleteAccountModal, setShowDeleteAccountModal])

  return useMemo(
    () => ({
      setShowDeleteAccountModal,
      DeleteAccountModal: DeleteAccountModalCallback,
    }),
    [setShowDeleteAccountModal, DeleteAccountModalCallback]
  )
}
