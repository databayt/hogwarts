"use client"

import * as React from "react"
import { X } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TenantsSearch() {
  const [value, setValue] = React.useState("")
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString
      .withOptions({ shallow: false, history: "replace", clearOnDefault: true })
      .withDefault("")
  )

  React.useEffect(() => {
    setValue(search ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      setValue(next)
      const handler = setTimeout(() => {
        void setSearch(next || null)
      }, 300)
      return () => clearTimeout(handler)
    },
    [setSearch]
  )

  const onClear = React.useCallback(() => {
    setValue("")
    void setSearch(null)
  }, [setSearch])

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Search name or domain"
        className="h-8 w-40 lg:w-56"
        value={value}
        onChange={onChange}
      />
      {value && (
        <Button
          aria-label="Clear search"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
