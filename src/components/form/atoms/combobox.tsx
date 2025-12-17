"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { BaseFieldProps } from "../types"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxFieldProps extends BaseFieldProps {
  options: ComboboxOption[]
  searchPlaceholder?: string
  emptyMessage?: string
}

/**
 * Combobox Field (Atom)
 *
 * Searchable select dropdown with react-hook-form integration.
 * Use for large option lists that benefit from search.
 *
 * **Role**: Single-purpose atom for searchable option selection
 *
 * **Usage Across App**:
 * - Country selection (large lists)
 * - Student selection (search by name)
 * - Subject selection (course lists)
 * - Teacher selection (staff lists)
 * - Tag selection (categories)
 * - City/location selection
 *
 * @example
 * ```tsx
 * <ComboboxField
 *   name="country"
 *   label="Country"
 *   options={countries}
 *   searchPlaceholder="Search countries..."
 *   emptyMessage="No country found."
 * />
 * ```
 */
export function ComboboxField({
  name,
  label,
  description,
  placeholder = "Select...",
  required,
  disabled,
  className,
  options,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
}: ComboboxFieldProps) {
  const form = useFormContext()
  const [open, setOpen] = React.useState(false)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={disabled}
                  className={cn(
                    "w-full justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? options.find((option) => option.value === field.value)
                        ?.label
                    : placeholder}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          field.onChange(option.value)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "me-2 h-4 w-4",
                            field.value === option.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
