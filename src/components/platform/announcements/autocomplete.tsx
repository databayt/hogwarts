"use client";

import * as React from "react";
import { useCallback, useState, useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface AutocompleteOption {
  id: string;
  value: string;
  label?: string;
}

interface AnnouncementAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  dir?: "ltr" | "rtl";
  emptyMessage?: string;
  groupHeading?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  isTextarea?: boolean;
  rows?: number;
}

export function AnnouncementAutocomplete({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  dir,
  emptyMessage = "No suggestions",
  groupHeading = "Previous entries",
  className,
  inputClassName,
  autoFocus,
  isTextarea = false,
  rows = 6,
}: AnnouncementAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const debouncedValue = useDebounce(value, 300);

  // Filter options based on debounced input
  const filteredOptions = useMemo(() => {
    if (!debouncedValue) return options.slice(0, 5);
    return options
      .filter(
        (opt) =>
          opt.value.toLowerCase().includes(debouncedValue.toLowerCase()) &&
          opt.value !== value
      )
      .slice(0, 5);
  }, [options, debouncedValue, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        close();
      }
    },
    [close]
  );

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue);
      close();
    },
    [onValueChange, close]
  );

  const inputStyles = cn(
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    isTextarea ? "min-h-[160px]" : "h-10",
    inputClassName
  );

  return (
    <Command shouldFilter={false} className={cn("overflow-visible", className)}>
      <div className="relative w-full">
        {isTextarea ? (
          <CommandPrimitive.Input
            asChild
            value={value}
            onValueChange={onValueChange}
          >
            <textarea
              placeholder={placeholder}
              disabled={disabled}
              dir={dir}
              autoFocus={autoFocus}
              rows={rows}
              onBlur={close}
              onFocus={open}
              onKeyDown={handleKeyDown}
              className={inputStyles}
            />
          </CommandPrimitive.Input>
        ) : (
          <CommandPrimitive.Input
            value={value}
            onValueChange={onValueChange}
            onBlur={close}
            onFocus={open}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            dir={dir}
            autoFocus={autoFocus}
            className={inputStyles}
          />
        )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="relative animate-in fade-in-0 zoom-in-95">
          <CommandList>
            <div className="absolute top-1.5 z-50 w-full rounded-md border bg-popover shadow-md">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup heading={groupHeading}>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.value}
                    onMouseDown={(e) => e.preventDefault()}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <span
                      className={isTextarea ? "line-clamp-2 text-sm" : "truncate"}
                    >
                      {option.label || option.value}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </CommandList>
        </div>
      )}
    </Command>
  );
}
