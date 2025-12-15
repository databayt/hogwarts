import { Bell, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserButton } from "@/components/auth/user-button"
import { Breadcrumbs } from "@/components/operator/breadcrumbs"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"

import ImpersonationBanner from "../../operator/impersonation-banner"

export default function DashboardHeader() {
  return (
    <div>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <SidebarTrigger className="size-7" />
        <div className="hidden h-7 items-center md:flex">
          <Breadcrumbs />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-7">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-7">
            <Mail className="h-4 w-4" />
            <span className="sr-only">Messages</span>
          </Button>
          <ModeSwitcher />
          <UserButton />
        </div>
      </header>
      <ImpersonationBanner />
    </div>
  )
}
