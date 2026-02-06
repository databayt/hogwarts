import { SidebarTrigger } from "@/components/ui/sidebar"
import { currentUser } from "@/components/auth/auth"

import UserProfileDropDown from "./user-profile-dropdown"

export default async function DashboardHeader() {
  const user = await currentUser()
  return (
    <header className="sticky top-0 flex h-14 w-full items-center border-b px-4 backdrop-blur-3xl">
      <SidebarTrigger />
      <div>
        Welcome{" "}
        <span className="font-semibold">
          <span>{user?.name ?? "-"}</span>
        </span>
      </div>

      <div className="ms-auto w-fit">
        <UserProfileDropDown isArrowUp={false} isFullName={false} />
      </div>
    </header>
  )
}
