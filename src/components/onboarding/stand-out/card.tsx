"use client"

import React from "react"
import { Star } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StandOutCardProps {
  title?: string
  description?: string
}

export function StandOutCard({
  title = "What Makes You Stand Out",
  description = "Now let's highlight what makes your school unique and special.",
}: StandOutCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Star className="text-primary h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-lg">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          This marks the beginning of the second stage of your onboarding
          process. We'll help you showcase what makes your school special.
        </p>
      </CardContent>
    </Card>
  )
}

export default StandOutCard
