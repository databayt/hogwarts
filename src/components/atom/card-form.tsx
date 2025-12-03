"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface CardFormProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
  dir?: "ltr" | "rtl"
}

export function CardForm({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  dir = "ltr",
}: CardFormProps) {
  return (
    <Card
      className={cn("shadow-none border", className)}
      dir={dir}
      data-slot="card-form"
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn("grid gap-6", contentClassName)}>
        {children}
      </CardContent>
      {footer && <CardFooter className="justify-between space-x-2">{footer}</CardFooter>}
    </Card>
  )
}
