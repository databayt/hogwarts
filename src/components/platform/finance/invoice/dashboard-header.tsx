import { currentUser } from "@/components/auth/auth"
import user-profile-dropdown from "./UserProfileDropdown"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function DashboardHeader(){
    const user = await currentUser()
    return(
       <header className="sticky top-0 h-14  w-full border-b backdrop-blur-3xl flex items-center px-4">
            <SidebarTrigger/>
            <div>
                Welcome <span className="font-semibold">
                    <span>{user?.name ?? "-"}</span>
                </span>
            </div>

            <div className="ml-auto w-fit">
                <user-profile-dropdown
                    isArrowUp={false}
                    isFullName={false}
                />
            </div>
       </header>
    )
}


