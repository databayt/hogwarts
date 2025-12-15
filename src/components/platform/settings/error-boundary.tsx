"use client"

import React from "react"
import { RefreshCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  dictionary?: Dictionary["school"]
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SettingsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Settings Error Boundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { dictionary } = this.props

      return (
        <div className="py-10">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <TriangleAlert className="text-destructive h-6 w-6" />
                <CardTitle>
                  {dictionary?.settings?.errors?.somethingWrong ||
                    "Something went wrong"}
                </CardTitle>
              </div>
              <CardDescription>
                {dictionary?.settings?.errors?.settingsError ||
                  "An error occurred while loading the settings page. Please try refreshing the page."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-muted-foreground font-mono text-sm">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2 rtl:flex-row-reverse"
              >
                <RefreshCw className="h-4 w-4" />
                {dictionary?.settings?.errors?.refreshPage || "Refresh Page"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
