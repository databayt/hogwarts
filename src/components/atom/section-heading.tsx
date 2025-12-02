import { cn } from "@/lib/utils"
import Link from "next/link"
import React from "react"

interface SectionHeadingProps {
  title: string
  description?: string | React.ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  align?: "left" | "center" | "right"
  // Optional link props
  linkText?: string
  linkHref?: string
  linkTarget?: string
  linkIcon?: React.ReactNode
  // Custom content
  children?: React.ReactNode
}

export default function SectionHeading({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  linkText,
  linkHref,
  linkTarget,
  linkIcon,
  children
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col items-center space-y-2 text-center pt-20", className)}>
      <h1
        className={cn(
          "font-heading text-5xl md:text-7xl leading-[1.1]",
          titleClassName
        )}
      >
        {title}
      </h1>
      
      {(description || linkText) && (
        <p 
          className={cn(
            "pb-8 leading-normal text-muted-foreground sm:leading-7 max-w-3xl",
            descriptionClassName
          )}
        >
          {description && <>{description} </>}
          {linkText && linkHref && (
            <Link
              href={linkHref}
              target={linkTarget}
              rel={linkTarget === "_blank" ? "noreferrer" : undefined}
              className="underline underline-offset-4 flex items-center justify-center text-foreground/70 hover:text-foreground"
            >
              {linkText}
              {linkIcon && <span className="ms-1">{linkIcon}</span>}
            </Link>
          )}
        </p>
      )}
      
      {children}
    </div>
  )
}
