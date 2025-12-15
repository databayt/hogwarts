"use client"

import { ExitIcon } from "@radix-ui/react-icons"
import { FaUser } from "react-icons/fa"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "@/components/auth/logout-button"

import { useCurrentUser } from "./use-current-user"

export const UserButton = () => {
  const user = useCurrentUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-4 w-4">
          <AvatarImage src={user?.image || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
            <FaUser />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <LogoutButton>
          <DropdownMenuItem>
            <ExitIcon className="me-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
