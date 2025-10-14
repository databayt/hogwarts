"use client";
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher";
import { UserButton } from "@/components/auth/user-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Bell, Mail } from "lucide-react";
import { useBreadcrumbs } from "@/components/operator/hooks/use-breadcrumbs";
import { LanguageSwitcher } from "@/components/internationalization/language-switcher";

export default function SaasHeader() {
  const breadcrumbItems = useBreadcrumbs();

  return (
    <div className="sticky top-0 z-40 bg-background -mx-2">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b mx-2">
        <div className="flex items-center gap-2 ">
          <SidebarTrigger className="size-7 -ml-1.5" />
          <div className="hidden md:flex items-center">
            {breadcrumbItems.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList className="flex items-center space-x-1">
                  {breadcrumbItems.map((item, index) => (
                    <div key={item.title} className="flex items-center">
                      {index !== breadcrumbItems.length - 1 && (
                        <BreadcrumbItem className="flex items-center">
                          <BreadcrumbLink href={item.link} className="flex items-center">
                            {item.title}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      )}
                      {index < breadcrumbItems.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block ml-2" />
                      )}
                      {index === breadcrumbItems.length - 1 && (
                        <BreadcrumbPage className="flex items-center">
                          {item.title}
                        </BreadcrumbPage>
                      )}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
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
          <LanguageSwitcher variant="toggle" className="size-7" />
          <ModeSwitcher />
          <UserButton />
        </div>
      </header>
    </div>
  );
}


