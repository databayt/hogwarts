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
import { useDictionary } from "@/components/internationalization/use-dictionary";
import { useLocale } from "@/components/internationalization/use-locale";
import { GenericCommandMenu } from "@/components/atom/generic-command-menu";
import { saasSearchConfig } from "@/components/atom/generic-command-menu/saas-config";
import { MobileNav } from "@/components/template/mobile-nav";
import { platformNav } from "@/components/template/saas-sidebar/config";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function SaasHeader() {
  const breadcrumbItems = useBreadcrumbs();
  const { dictionary } = useDictionary();
  const { isRTL, locale } = useLocale();

  // Transform operator nav items for mobile menu
  const mobileNavItems = useMemo(() => {
    return platformNav.map(item => ({
      href: item.href,
      label: item.title,
    }));
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-background -mx-2">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b mx-2">
        <div className="flex items-center gap-2">
          {/* Desktop: Sidebar trigger */}
          <SidebarTrigger className={cn("size-7 hidden lg:flex", isRTL ? '-mr-1.5' : '-ml-1.5')} />
          {/* Mobile: Popover-based menu */}
          <MobileNav
            items={mobileNavItems}
            className="flex lg:hidden"
            dictionary={dictionary ?? undefined}
            locale={locale}
          />
          <div className="hidden md:flex items-center">
            {breadcrumbItems.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}>
                  {breadcrumbItems.map((item, index) => {
                    // Translate breadcrumb title
                    const titleKey = item.title.toLowerCase();
                    const breadcrumbDict = dictionary?.saas?.breadcrumb as Record<string, string> | undefined;
                    const translatedTitle = breadcrumbDict?.[titleKey] || item.title;

                    return (
                      <div key={item.title} className="flex items-center">
                        {index !== breadcrumbItems.length - 1 && (
                          <BreadcrumbItem className="flex items-center">
                            <BreadcrumbLink href={item.link} className="flex items-center">
                              {translatedTitle}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        )}
                        {index < breadcrumbItems.length - 1 && (
                          <BreadcrumbSeparator className={`hidden md:block ${isRTL ? 'mr-2' : 'ml-2'}`} />
                        )}
                        {index === breadcrumbItems.length - 1 && (
                          <BreadcrumbPage className="flex items-center">
                            {translatedTitle}
                          </BreadcrumbPage>
                        )}
                      </div>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
          <GenericCommandMenu
            config={saasSearchConfig}
            variant="icon"
          />
          <LanguageSwitcher variant="toggle" />
          <ModeSwitcher />
          <Button variant="link" size="icon" className="size-7">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="link" size="icon" className="size-7">
            <Mail className="h-4 w-4" />
            <span className="sr-only">Messages</span>
          </Button>
          <UserButton />
        </div>
      </header>
    </div>
  );
}


