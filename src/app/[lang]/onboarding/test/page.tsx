"use client"

import { useState } from "react"

import {
  testDbAction,
  testGetSchoolTitle,
  testMinimalAction,
} from "@/components/onboarding/test-action"
// TEST: Import from title/actions.ts to isolate the issue
import { getSchoolTitle as getTitleFromActions } from "@/components/onboarding/title/actions"

// Force redeploy: v3
export default function TestPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (result: string) => {
    setResults((prev) => [...prev, `${new Date().toISOString()}: ${result}`])
  }

  const runMinimalTest = async () => {
    setLoading(true)
    addResult("Running minimal test...")
    try {
      const result = await testMinimalAction()
      addResult(`Minimal test result: ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`Minimal test error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const runDbTest = async () => {
    setLoading(true)
    addResult("Running DB test...")
    try {
      const result = await testDbAction()
      addResult(`DB test result: ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`DB test error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const runTestGetSchoolTitle = async () => {
    setLoading(true)
    addResult("Running testGetSchoolTitle (from test-action.ts)...")
    try {
      const result = await testGetSchoolTitle("test-school-id")
      addResult(`testGetSchoolTitle result: ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`testGetSchoolTitle error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const runGetTitleFromActions = async () => {
    setLoading(true)
    addResult("Running getSchoolTitle (from title/actions.ts)...")
    try {
      const result = await getTitleFromActions("test-school-id")
      addResult(
        `getSchoolTitle (title/actions.ts) result: ${JSON.stringify(result)}`
      )
    } catch (error) {
      addResult(`getSchoolTitle (title/actions.ts) error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Server Action Test Page</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={runMinimalTest}
          disabled={loading}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          Test Minimal Action
        </button>
        <button
          onClick={runDbTest}
          disabled={loading}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          Test DB Action
        </button>
        <button
          onClick={runTestGetSchoolTitle}
          disabled={loading}
          className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
        >
          Test GetSchoolTitle (test-action.ts)
        </button>
        <button
          onClick={runGetTitleFromActions}
          disabled={loading}
          className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
        >
          Test GetSchoolTitle (title/actions.ts)
        </button>
      </div>

      <div className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Results:</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">No tests run yet</p>
        ) : (
          <ul className="space-y-1 font-mono text-sm">
            {results.map((result, i) => (
              <li key={i}>{result}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
