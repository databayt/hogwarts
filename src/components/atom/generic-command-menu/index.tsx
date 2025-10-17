"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Laptop, Moon, Sun, Clock, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import type { SearchConfig, SearchContext, SearchItem } from "./types";
import { filterByRole, filterByQuery } from "./utils";
import { useRecentItems } from "./use-recent-items";
import { useDictionary } from "@/components/internationalization/use-dictionary";
import { useLocale } from "@/components/internationalization/use-locale";

interface GenericCommandMenuProps extends DialogProps {
  config: SearchConfig;
  context?: SearchContext;
  variant?: "default" | "compact";
}

export function GenericCommandMenu({
  config,
  context,
  variant = "default",
  ...props
}: GenericCommandMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { setTheme } = useTheme();
  const { recentSearchItems, addRecentItem } = useRecentItems();
  const { dictionary } = useDictionary();
  const { isRTL } = useLocale();

  // Get translations
  const commandMenuDict = dictionary?.commandMenu as Record<string, string> | undefined;
  const placeholder = config.placeholder || commandMenuDict?.placeholder || "Type a command or search...";
  const emptyMessage = config.emptyMessage || commandMenuDict?.noResults || "No results found.";

  // Keyboard shortcut handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter items by role and query
  const filteredNavigation = React.useMemo(() => {
    let items = config.navigation || [];
    items = filterByRole(items, context?.currentRole);
    items = filterByQuery(items, query);
    return items;
  }, [config.navigation, context?.currentRole, query]);

  const filteredActions = React.useMemo(() => {
    let items = config.actions || [];
    items = filterByRole(items, context?.currentRole);
    items = filterByQuery(items, query);
    return items;
  }, [config.actions, context?.currentRole, query]);

  const filteredSettings = React.useMemo(() => {
    let items = config.settings || [];
    items = filterByQuery(items, query);
    return items;
  }, [config.settings, query]);

  const filteredRecent = React.useMemo(() => {
    if (!config.showRecent) return [];
    return filterByQuery(recentSearchItems, query).slice(0, config.maxRecent || 5);
  }, [config.showRecent, config.maxRecent, recentSearchItems, query]);

  // Command execution handler
  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      setQuery("");
      command();
    },
    []
  );

  // Handle item selection
  const handleItemSelect = React.useCallback(
    (item: SearchItem) => {
      if (item.href) {
        // Save to recent items
        addRecentItem({
          id: item.id,
          title: item.title,
          href: item.href,
        });

        runCommand(() => router.push(item.href as string));
      } else if (item.action) {
        runCommand(item.action);
      }
    },
    [addRecentItem, runCommand, router]
  );

  // Render search item
  const renderItem = (item: SearchItem) => {
    const Icon = item.icon;

    return (
      <CommandItem
        key={item.id}
        value={`${item.title} ${item.keywords?.join(" ") || ""}`}
        onSelect={() => handleItemSelect(item)}
        className="flex items-center gap-2"
      >
        {Icon && <Icon className="h-4 w-4" />}
        <div className="flex flex-col flex-1">
          <span>{item.title}</span>
          {item.breadcrumb && item.breadcrumb.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {item.breadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3 w-3" />}
                  {crumb}
                </React.Fragment>
              ))}
            </span>
          )}
        </div>
        {item.shortcut && (
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            {item.shortcut}
          </kbd>
        )}
      </CommandItem>
    );
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12",
          variant === "compact" ? "md:w-40 lg:w-48" : "md:w-40 lg:w-56 xl:w-64"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">{placeholder}</span>
        <span className="inline-flex lg:hidden">
          {commandMenuDict?.searchShort || "Search..."}
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>

          {/* Recent items */}
          {filteredRecent.length > 0 && (
            <>
              <CommandGroup heading={commandMenuDict?.recent || "Recent"}>
                {filteredRecent.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleItemSelect(item)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation items */}
          {filteredNavigation.length > 0 && (
            <>
              <CommandGroup heading={commandMenuDict?.navigation || "Navigation"}>
                {filteredNavigation.map(renderItem)}
              </CommandGroup>
              {(filteredActions.length > 0 || filteredSettings.length > 0) && (
                <CommandSeparator />
              )}
            </>
          )}

          {/* Action items */}
          {filteredActions.length > 0 && (
            <>
              <CommandGroup heading={commandMenuDict?.actions || "Actions"}>
                {filteredActions.map(renderItem)}
              </CommandGroup>
              {filteredSettings.length > 0 && <CommandSeparator />}
            </>
          )}

          {/* Settings items */}
          {filteredSettings.length > 0 && (
            <CommandGroup heading={commandMenuDict?.settings || "Settings"}>
              {filteredSettings.map(renderItem)}
            </CommandGroup>
          )}

          {/* Theme switcher (always visible) */}
          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading={commandMenuDict?.theme || "Theme"}>
                <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                  <Sun className="h-4 w-4" />
                  {commandMenuDict?.light || "Light"}
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                  <Moon className="h-4 w-4" />
                  {commandMenuDict?.dark || "Dark"}
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                  <Laptop className="h-4 w-4" />
                  {commandMenuDict?.system || "System"}
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
