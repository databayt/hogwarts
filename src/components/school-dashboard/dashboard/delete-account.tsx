"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useDeleteAccountModal } from "@/components/saas-marketing/pricing/modals/delete-account-modal"
import { Icons } from "@/components/saas-marketing/pricing/shared/icons"
import { SectionColumns } from "@/components/school-dashboard/dashboard/section-columns"

const siteConfig = { name: "Hogwarts" } as const

export function DeleteAccountSection() {
  const { dictionary } = useDictionary()
  const d = (dictionary?.school as any)?.settings?.deleteAccount as
    | Record<string, string>
    | undefined
  const { setShowDeleteAccountModal, DeleteAccountModal } =
    useDeleteAccountModal()

  const userPaidPlan = true

  return (
    <div className="bg-muted my-6 rounded-lg px-6">
      <DeleteAccountModal />
      <SectionColumns
        title={d?.title || "Delete Account"}
        description={d?.dangerZone || "This is a danger zone - Be careful !"}
      >
        <div className="flex flex-col gap-4 rounded-xl border border-red-400 p-4 dark:border-red-900">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium">
                {d?.areYouSure || "Are you sure ?"}
              </span>

              {userPaidPlan ? (
                <div className="flex items-center gap-1 rounded-md bg-red-600/10 p-1 pe-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-500">
                  <div className="m-0.5 rounded-full bg-red-600 p-[3px]">
                    <Icons.close size={10} className="text-background" />
                  </div>
                  {d?.activeSubscription || "Active Subscription"}
                </div>
              ) : null}
            </div>
            <div className="text-muted-foreground text-sm text-balance">
              {(
                d?.permanentlyDelete || "Permanently delete your {name} account"
              ).replace("{name}", siteConfig.name)}
              {userPaidPlan
                ? d?.andSubscription || " and your subscription"
                : ""}
              .{" "}
              {d?.cannotBeUndone ||
                "This action cannot be undone - please proceed with caution."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="destructive"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              <Icons.trash className="me-2 size-4" />
              <span>{d?.deleteButton || "Delete Account"}</span>
            </Button>
          </div>
        </div>
      </SectionColumns>
    </div>
  )
}
