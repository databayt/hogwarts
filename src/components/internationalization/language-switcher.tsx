'use client';

import { useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/internationalization/use-locale';
import { i18n, localeConfig, type Locale } from '@/components/internationalization/config';
import { setLocale } from '@/components/internationalization/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "dropdown" | "inline" | "toggle";
}

export function LanguageSwitcher({
  className,
  variant = "dropdown"
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const { locale: currentLocale, isRTL } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale || isLoading) return;

    setIsLoading(true);
    startTransition(async () => {
      try {
        await setLocale(locale, pathname);
      } catch (error) {
        console.error('Failed to switch locale:', error);
        setIsLoading(false);
      }
    });
  };

  // Toggle variant - simple button that switches to the other language
  if (variant === "toggle") {
    // Find the next locale (not the current one)
    const nextLocale = i18n.locales.find(locale => locale !== currentLocale) || i18n.locales[0];

    return (
      <Button
        variant="link"
        size="icon"
        className={cn("h-8 w-8 px-0", className)}
        onClick={() => handleLocaleChange(nextLocale)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Languages className="h-4 w-4" />
        )}
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
              disabled={isLoading}
              className={cn(
                "px-3 py-1 rounded-md transition-colors flex items-center gap-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-lg">{config.flag}</span>
              <span className="text-sm">{config.nativeName}</span>
              {isLoading && !isActive && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
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
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
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
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 w-full cursor-pointer",
                isActive && "bg-muted",
                isLoading && "opacity-50 cursor-not-allowed"
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