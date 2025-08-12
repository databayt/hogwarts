import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher";
import { UserButton } from "@/components/auth/user-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/platform/operator/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Bell, Mail } from "lucide-react";
import ImpersonationBanner from "../../platform/operator/impersonation-banner";

export default function DashboardHeader() {
  return (
    <div className="sticky top-0 z-40 bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b ">
        <SidebarTrigger className="size-7 -ml-1" />
        <div className="hidden md:flex items-center h-7">
          <Breadcrumbs />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="link" size="icon" className="size-7">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="link" size="icon" className="size-7">
            <Mail className="h-4 w-4" />
            <span className="sr-only">Messages</span>
          </Button>
          <ModeSwitcher />
          <UserButton />
        </div>
      </header>
      <ImpersonationBanner />
    </div>
  );
}


