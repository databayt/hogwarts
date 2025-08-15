import { School } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TitleCardProps {
  title: string;
  className?: string;
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
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground">
              {title || "School name not set"}
            </h3>
            {title && (
              <p className="text-sm text-muted-foreground mt-1">
                This will be your school's official name in the system
              </p>
            )}
          </div>
          
          {!title && (
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please set your school name to continue with the setup process
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
