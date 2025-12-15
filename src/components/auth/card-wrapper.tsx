"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { BackButton } from "@/components/auth/back-button"
import { Header } from "@/components/auth/header"
import { Social } from "@/components/auth/social"

interface CardWrapperProps {
  children: React.ReactNode
  headerLabel: string
  backButtonLabel: string
  backButtonHref: string
  showSocial?: boolean
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: CardWrapperProps) => {
  return (
    <Card className="bg-background w-[350px] border-none shadow-none">
      <CardHeader>
        <Header label={headerLabel} />
      </CardHeader>
      {showSocial && (
        <CardContent>
          <Social />
        </CardContent>
      )}
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">
          Or
        </span>
      </div>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <BackButton label={backButtonLabel} href={backButtonHref} />
      </CardFooter>
    </Card>
  )
}
