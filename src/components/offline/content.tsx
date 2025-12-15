"use client"

import { WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface OfflineContentProps {
  dictionary: Dictionary
  lang: Locale
}

export function OfflineContent({ dictionary, lang }: OfflineContentProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-6 px-4 text-center">
        <div className="flex justify-center">
          <div className="bg-muted rounded-full p-6">
            <WifiOff className="text-muted-foreground h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h1>You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Some features
            may not be available until you're back online.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">While offline, you can:</p>
          <ul className="space-y-1 text-start">
            <li>• View previously cached pages</li>
            <li>• Access downloaded documents</li>
            <li>• Review saved student data</li>
          </ul>

          <Button onClick={() => window.location.reload()} variant="default">
            Try Again
          </Button>
        </div>

        <small className="text-muted-foreground">
          Your data will sync automatically when you reconnect
        </small>
      </div>
    </div>
  )
}
