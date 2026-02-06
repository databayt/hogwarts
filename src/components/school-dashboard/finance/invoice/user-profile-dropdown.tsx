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
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <UserProfile />
        <DropdownMenuItem
          onClick={async () => {
            "use server"
            await signOut()
          }}
          className="cursor-pointer bg-red-50 font-medium text-red-500 hover:bg-red-100"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
