"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { DomainRow } from "../columns"
import { domainsSearchParams } from "../validation"

interface DomainsData {
  rows: DomainRow[]
  pageCount: number
}

export function useDomainsData() {
  const [data, setData] = useState<DomainsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchDomainsData() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams(searchParams)
        const response = await fetch(`/api/domains?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch domains data")
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDomainsData()
  }, [searchParams])

  return { data, isLoading, error }
}
