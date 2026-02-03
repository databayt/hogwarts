"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
// Avoid tight coupling to Prisma User type; accept minimal shape
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  updateUserName,
  type FormData,
} from "@/components/saas-marketing/pricing/forms/user-name.action"
import { Icons } from "@/components/saas-marketing/pricing/shared/icons"
import { SectionColumns } from "@/components/school-dashboard/dashboard/section-columns"

import { userNameSchema } from "../validation"

interface UserNameFormProps {
  user: { id: string; name: string }
}

export function UserNameForm({ user }: UserNameFormProps) {
  const { update } = useSession()
  const [updated, setUpdated] = useState(false)
  const [isPending, startTransition] = useTransition()
  const updateUserNameWithId = updateUserName.bind(null, user.id)

  const checkUpdate = (value: string) => {
    setUpdated(user.name !== value)
  }

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userNameSchema),
    defaultValues: { name: user.name || "" },
  })

  const onSubmit = handleSubmit((data: FormData) => {
    startTransition(async () => {
      const { status } = await updateUserNameWithId(data)

      if (status !== "success") {
        toast.error("Something went wrong.", {
          description: "Your name was not updated. Please try again.",
        })
      } else {
        await update()
        setUpdated(false)
        toast.success("Your name has been updated.")
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="">
      <SectionColumns
        title="Your Name"
        description="Please enter a display name you are comfortable with."
      >
        <div className="flex w-full items-center gap-2">
          <Label className="sr-only" htmlFor="name">
            Name
          </Label>
          <Input
            id="name"
            className="flex-1"
            size={32}
            {...register("name")}
            onChange={(e) => checkUpdate(e.target.value)}
          />
          <Button
            type="submit"
            variant={updated ? "default" : "secondary"}
            disabled={isPending || !updated}
            className="w-[67px] shrink-0 px-0 sm:w-[130px]"
          >
            {isPending ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <p>
                Save
                <span className="hidden sm:inline-flex">&nbsp;Changes</span>
              </p>
            )}
          </Button>
        </div>
        <div className="flex flex-col justify-between p-1">
          {errors?.name && (
            <p className="pb-0.5 text-[13px] text-red-600">
              {errors.name.message}
            </p>
          )}
          <p className="text-muted-foreground text-[13px]">Max 32 characters</p>
        </div>
      </SectionColumns>
    </form>
  )
}
