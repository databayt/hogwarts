import { Image, Palette } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BrandingCardProps {
  logoUrl?: string
  brandName: string
  tagline?: string
  primaryColor?: string
  secondaryColor?: string
  className?: string
}

export function BrandingCard({
  logoUrl,
  brandName,
  tagline,
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  className,
}: BrandingCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          School Branding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Brand Preview */}
          <div className="bg-muted/20 rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="School Logo"
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
                  <Image className="text-muted-foreground h-6 w-6" />
                </div>
              )}
              <div>
                <h3 className="text-foreground font-semibold">
                  {brandName || "School Name"}
                </h3>
                {tagline && (
                  <p className="muted text-muted-foreground">{tagline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded border"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="muted font-medium">Primary</span>
              </div>
              <span className="text-muted-foreground font-mono text-xs">
                {primaryColor}
              </span>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded border"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="muted font-medium">Secondary</span>
              </div>
              <span className="text-muted-foreground font-mono text-xs">
                {secondaryColor}
              </span>
            </div>
          </div>

          {!brandName && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="muted text-muted-foreground">
                Please set your school branding to continue setup
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
