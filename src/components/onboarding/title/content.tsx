"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// ULTRA MINIMAL: Remove ALL imports that might have problematic import chains
// Only keep absolutely essential React hooks and Next.js navigation

import { useTitle } from "./use-title"

interface Props {
  dictionary?: any
}

export default function TitleContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const schoolId = params.id as string
  const { data: titleData, loading, error } = useTitle(schoolId)

  // ULTRA MINIMAL: Just test if the page loads at all
  if (loading) {
    return (
      <div className="w-full p-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            Error Loading Title
          </h2>
          <p className="mt-2 text-red-600">{error}</p>
          <p className="mt-4 text-sm text-gray-600">
            Debug: schoolId = {schoolId}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-8">
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-bold">
          ✅ Title Page Loaded Successfully!
        </h2>
        <p className="mt-4">School ID: {schoolId}</p>
        <p className="mt-2">Title Data: {JSON.stringify(titleData)}</p>
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
          onClick={() => router.push(`/onboarding/${schoolId}/description`)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
