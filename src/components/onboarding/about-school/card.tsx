"use client"

import React from "react"
import { Building } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface AboutSchoolCardProps {
  title?: string
  description?: string
}

export function AboutSchoolCard({ title, description }: AboutSchoolCardProps) {
  const { dictionary } = useDictionary()

  const defaultTitle =
    title ||
    dictionary?.marketing?.onboarding?.aboutSchool?.title ||
    "About Your School"
  const defaultDescription =
    description ||
    dictionary?.marketing?.onboarding?.aboutSchool?.description ||
    "Welcome! Let's start building your school profile."
  const longDescription =
    dictionary?.marketing?.onboarding?.aboutSchool?.longDescription ||
    "This is the first step of your school onboarding process. We'll help you set up everything you need to get started."

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Building className="text-primary h-6 w-6" />
        </div>
        <h3>{defaultTitle}</h3>
        <p className="lead">{defaultDescription}</p>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">{longDescription}</p>
      </CardContent>
    </Card>
  )
}

export default AboutSchoolCard
