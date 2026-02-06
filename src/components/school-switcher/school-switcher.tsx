"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, School } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getAvailableSchools, switchSchool } from "./actions"

interface SchoolOption {
  id: string
  name: string
  domain: string
}

export function SchoolSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null)

  useEffect(() => {
    getAvailableSchools().then(({ schools, currentSchoolId }) => {
      setSchools(schools)
      setCurrentSchoolId(currentSchoolId)
    })
  }, [])

  // Don't render if user has 0-1 schools (no switching possible)
  if (schools.length <= 1) return null

  const currentSchool = schools.find((s) => s.id === currentSchoolId)

  function handleSwitch(schoolId: string) {
    startTransition(async () => {
      const result = await switchSchool(schoolId)
      if (result.success && "domain" in result && result.domain) {
        // Redirect to the new school's subdomain
        const isDev = window.location.hostname.includes("localhost")
        const newUrl = isDev
          ? `http://${result.domain}.localhost:3000/dashboard`
          : `https://${result.domain}.databayt.org/dashboard`
        window.location.href = newUrl
      } else {
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <School className="me-2 h-4 w-4" />
          {currentSchool?.name || "Select School"}
          <ChevronsUpDown className="ms-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch School</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {schools.map((school) => (
          <DropdownMenuItem
            key={school.id}
            onClick={() => handleSwitch(school.id)}
            disabled={school.id === currentSchoolId || isPending}
          >
            <span className="truncate">{school.name}</span>
            {school.id === currentSchoolId && (
              <span className="ms-auto text-xs opacity-50">Current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
