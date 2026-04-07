// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"
import { auth } from "@/auth"
import { ChevronDown } from "lucide-react"
import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUserById } from "@/components/auth/user"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import getAvatarName from "@/components/school-dashboard/finance/invoice/get-avatar-name"

import UserProfile from "./user-profile"

interface IUserProfileDropdown {
  isFullName: boolean
  isArrowUp: boolean
}

export default async function UserProfileDropDown({
  isFullName,
  isArrowUp,
}: IUserProfileDropdown) {
  const session = await auth()
  const user = session?.user
  const extendedUser = user ? await getUserById(user.id) : null

  const headersList = await headers()
  const lang = (headersList.get("x-locale") || "ar") as Locale
  const dictionary = await getDictionary(lang)
  const ip = (dictionary as any)?.finance?.invoiceProfile as
    | Record<string, string>
    | undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex cursor-pointer items-center gap-3">
          <Avatar className="size-9 cursor-pointer border bg-neutral-300">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback>
              {getAvatarName(
                extendedUser?.firstName || "",
                extendedUser?.lastName || ""
              )}
            </AvatarFallback>
          </Avatar>
          {isFullName && extendedUser && (
            <div>
              <p className="line-clamp-1 font-medium text-ellipsis">
                <span>{extendedUser.firstName}</span>{" "}
                <span>{extendedUser.lastName}</span>
              </p>
            </div>
          )}

          {isArrowUp && <ChevronDown className="ms-auto transition-all" />}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[250px]">
        <DropdownMenuLabel>{ip?.myAccount || "My Account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <UserProfile />
        <DropdownMenuItem
          onClick={async () => {
            "use server"
            await signOut()
          }}
          className="cursor-pointer bg-red-50 font-medium text-red-500 hover:bg-red-100"
        >
          {ip?.logout || "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
