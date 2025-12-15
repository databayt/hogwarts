"use client"

import React from "react"
import { AlertCircle, CheckCircle, Globe } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { SUBDOMAIN_CONSTANTS } from "./config"
import type { SubdomainData } from "./types"

interface SubdomainCardProps {
  data?: SubdomainData
  domain?: string
  isAvailable?: boolean
  isChecking?: boolean
  showPreview?: boolean
}

export function SubdomainCard({
  data,
  domain = data?.domain,
  isAvailable,
  isChecking = false,
  showPreview = true,
}: SubdomainCardProps) {
  const fullDomain = domain
    ? `${domain}${SUBDOMAIN_CONSTANTS.DOMAIN_SUFFIX}`
    : null

  if (!showPreview || !domain) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Globe className="text-primary h-6 w-6" />
          </div>
          <CardTitle>Your School Domain</CardTitle>
          <CardDescription>
            Choose a unique web address for your school
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          School Domain Preview
        </CardTitle>
        <CardDescription>
          This will be your school's web address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-center">
          <div className="bg-muted rounded-lg p-4">
            <div className="font-mono text-lg">{fullDomain}</div>
          </div>

          {isChecking ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
              Checking availability...
            </div>
          ) : isAvailable !== undefined ? (
            <div className="flex items-center justify-center gap-2">
              {isAvailable ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-600">
                    Available
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="destructive">Already taken</Badge>
                </>
              )}
            </div>
          ) : null}

          <p className="text-muted-foreground text-sm">
            Students, teachers, and parents will access your school at this
            address
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubdomainCard
