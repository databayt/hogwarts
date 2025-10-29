import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/auth";
import { getUserById } from "@/components/auth/user";
import getAvatarName from "@/components/platform/finance/invoice/get-avatar-name";
import { ChevronDown } from "lucide-react";
import UserProfile from "./user-profile";
import { signOut } from "next-auth/react";

interface IUserProfileDropdown {
  isFullName: boolean;
  isArrowUp: boolean;
}

export default async function UserProfileDropDown({
  isFullName,
  isArrowUp,
}: IUserProfileDropdown) {
  const session = await auth();
  const user = session?.user;
  const extendedUser = user ? await getUserById(user.id) : null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer">
          <Avatar className="border size-9 bg-neutral-300 cursor-pointer">
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
              <p className="text-ellipsis line-clamp-1 font-medium">
                <span>{extendedUser.firstName}</span>{" "}
                <span>{extendedUser.lastName}</span>
              </p>
            </div>
          )}

          {isArrowUp && <ChevronDown className="transition-all ml-auto" />}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[250px]">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <UserProfile />
        <DropdownMenuItem
          onClick={async () => {
            "use server";
            await signOut();
          }}
          className="bg-red-50 text-red-500 hover:bg-red-100 font-medium cursor-pointer"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


