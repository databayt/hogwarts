'use client';

import { useRouter } from 'next/navigation';
import { useSwitchLocaleHref, useLocale } from '@/components/internationalization/use-locale';
import { i18n, localeConfig, type Locale } from '@/components/internationalization/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "dropdown" | "inline" | "toggle";
}

export function LanguageSwitcher({
  className,
  variant = "dropdown"
}: LanguageSwitcherProps) {
  const router = useRouter();
  const getSwitchLocaleHref = useSwitchLocaleHref();
  const { locale: currentLocale, isRTL } = useLocale();

  const handleLocaleChange = (locale: Locale) => {
    // Set cookie to persist locale preference
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;

    // Navigate to the new locale URL
    const newPath = getSwitchLocaleHref(locale);
    router.push(newPath);
  };

  // Toggle variant - simple button that switches to the other language
  if (variant === "toggle") {
    // Find the next locale (not the current one)
    const nextLocale = i18n.locales.find(locale => locale !== currentLocale) || i18n.locales[0];

    return (
      <Button
        variant="link"
        size="icon"
        className={cn("h-8 w-8 px-0 cursor-pointer hover:opacity-70 transition-opacity", className)}
        onClick={() => handleLocaleChange(nextLocale)}
      >
        <Languages className="h-4 w-4" />
        <span className="sr-only">Switch language</span>
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex gap-2", className)}>
        {i18n.locales.map((locale) => {
          const config = localeConfig[locale];
          const isActive = locale === currentLocale;

          return (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <span className="text-lg mr-2">{config.flag}</span>
              <span className="text-sm">{config.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", className)}
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        {i18n.locales.map((locale) => {
          const config = localeConfig[locale];
          const isActive = locale === currentLocale;

          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                "flex items-center gap-2 w-full cursor-pointer",
                isActive && "bg-muted"
              )}
            >
              <span className="text-lg">{config.flag}</span>
              <span>{config.nativeName}</span>
              {isActive && (
                <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-xs`}>✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
