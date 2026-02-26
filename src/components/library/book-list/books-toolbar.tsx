"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  genres: string[]
  gradeLevelLabels: Record<string, string>
  searchPlaceholder: string
  genreLabel: string
  gradeLabel: string
}

export default function BooksToolbar({
  genres,
  gradeLevelLabels,
  searchPlaceholder,
  genreLabel,
  gradeLabel,
}: Props) {
  const sp = useSearchParams()
  const router = useRouter()

  const search = sp.get("search") ?? ""
  const genre = sp.get("genre") ?? ""
  const gradeLevel = sp.get("gradeLevel") ?? ""

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    // Reset page when filters change
    params.delete("page")
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Input
        className="w-40"
        placeholder={searchPlaceholder}
        defaultValue={search}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate({ search: (e.target as HTMLInputElement).value })
          }
        }}
      />

      <Select
        value={genre || ""}
        onValueChange={(value) =>
          navigate({ genre: value === "__all__" ? "" : value })
        }
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder={genreLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{genreLabel}</SelectItem>
          {genres.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={gradeLevel || ""}
        onValueChange={(value) =>
          navigate({ gradeLevel: value === "__all__" ? "" : value })
        }
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder={gradeLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{gradeLabel}</SelectItem>
          {Object.entries(gradeLevelLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
