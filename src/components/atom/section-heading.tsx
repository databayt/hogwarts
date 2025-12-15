import React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

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
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center space-y-2 pt-20 text-center",
        className
      )}
    >
      <h1
        className={cn(
          "font-heading text-4xl leading-[1.1] font-extrabold md:text-5xl",
          titleClassName
        )}
      >
        {title}
      </h1>

      {(description || linkText) && (
        <p
          className={cn(
            "text-muted-foreground max-w-3xl pb-8 leading-normal sm:leading-7",
            descriptionClassName
          )}
        >
          {description && <>{description} </>}
          {linkText && linkHref && (
            <Link
              href={linkHref}
              target={linkTarget}
              rel={linkTarget === "_blank" ? "noreferrer" : undefined}
              className="text-foreground/70 hover:text-foreground flex items-center justify-center underline underline-offset-4"
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
