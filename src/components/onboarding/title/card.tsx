import { School } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TitleCardProps {
  title: string
  className?: string
}

export function TitleCard({ title, className }: TitleCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          School Name
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-foreground text-lg font-semibold">
              {title || "School name not set"}
            </h3>
            {title && (
              <p className="text-muted-foreground mt-1 text-sm">
                This will be your school's official name in the system
              </p>
            )}
          </div>

          {!title && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                Please set your school name to continue with the setup process
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
