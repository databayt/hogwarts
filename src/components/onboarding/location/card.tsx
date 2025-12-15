import { Globe, MapPin } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LocationCardProps {
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  className?: string
}

export function LocationCard({
  address,
  city,
  state,
  country,
  postalCode,
  className,
}: LocationCardProps) {
  const hasLocation = address && city && country

  const formatAddress = () => {
    if (!hasLocation) return "Location not set"

    const parts = [address, city, state, country, postalCode].filter(Boolean)
    return parts.join(", ")
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          School Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Globe className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">
                  {formatAddress()}
                </p>
                {hasLocation && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    This address will be visible to parents and staff
                  </p>
                )}
              </div>
            </div>
          </div>

          {!hasLocation && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                Please set your school's location to continue with the setup
                process
              </p>
            </div>
          )}

          {hasLocation && (
            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
              {address && (
                <div>
                  <span className="font-medium">Address:</span> {address}
                </div>
              )}
              {city && (
                <div>
                  <span className="font-medium">City:</span> {city}
                </div>
              )}
              {state && (
                <div>
                  <span className="font-medium">State:</span> {state}
                </div>
              )}
              {country && (
                <div>
                  <span className="font-medium">Country:</span> {country}
                </div>
              )}
              {postalCode && (
                <div>
                  <span className="font-medium">Postal:</span> {postalCode}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
